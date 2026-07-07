from fastapi import APIRouter, Body, Depends, HTTPException, Query
from prisma import Prisma
from prisma.enums import TypeOfComponent
from prisma.errors import RecordNotFoundError

from .auth.auth import get_current_user
from .auth.models import User
from .database import get_db
from models import Component, ComponentCreate, ComponentUpdate, ComponentTree, TreeNode, GraphData, Node, NodeData, Edge

from controllers.tree import get_tree


router = APIRouter(prefix="/analytics", tags=["analytics"])


async def _get_component_cost(component_name: str, db: Prisma) -> float:
    try:
        component = await db.components.find_first(
            where={"componentName": component_name}
        )
        if not component:
            raise RecordNotFoundError(f"Component '{component_name}' not found")
        return component.cost
    except RecordNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


async def _get_component_labor_cost(component_name: str, db: Prisma) -> float:
    """Compute labor cost using each stage's assigned labor profile rate."""
    try:
        component = await db.components.find_first(
            where={"componentName": component_name},
            include={"productionStages": {"include": {"laborProfile": True}}}
        )
        if not component:
            raise RecordNotFoundError(f"Component '{component_name}' not found")

        total_labor = 0.0
        for stage in (component.productionStages or []):
            if stage.laborProfile:
                total_labor += stage.duration * stage.laborProfile.hourlyRate
        return total_labor
    except RecordNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


async def _get_component_duration(component_name: str, db: Prisma) -> float:
    try:
        component = await db.components.find_first(
            where={"componentName": component_name},
            include={"productionStages": {"order_by": {"order": "asc"}}}
        )
        if not component:
            raise RecordNotFoundError(f"Component '{component_name}' not found")
        total_duration = sum(stage.duration for stage in (component.productionStages or []))
        return total_duration
    except RecordNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


async def _get_component_delivery_duration(component_name: str, db: Prisma) -> float:
    try:
        component = await db.components.find_first(
            where={"componentName": component_name}
        )
        if not component:
            raise RecordNotFoundError(f"Component '{component_name}' not found")
        return component.delivery_time or 0.0
    except RecordNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/total-cost", response_model=dict)
async def get_component_total_cost(
    topName: str = Query(...),
    amount: float = Query(1.0, description="Amount of the component"),
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        tree = await get_tree(topName=topName, db=db, current_user=current_user)

        async def dfs_post_order_cost(node):
            children_cost = 0.
            for child in node["children"]:
                child_cost = await dfs_post_order_cost(child)
                children_cost += child_cost * child["amount"]

            material_cost = await _get_component_cost(node["name"], db)
            labor_cost = await _get_component_labor_cost(node["name"], db)
            return children_cost + material_cost + labor_cost

        total_calculated_cost = await dfs_post_order_cost(tree["tree"])
        return {"total_cost": total_calculated_cost * amount}

    except RecordNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except OSError as e:
        raise HTTPException(status_code=400, detail=f"Could not retrieve component tree: {str(e)}")


@router.get("/total-duration", response_model=dict)
async def get_component_total_duration(
    topName: str = Query(...),
    amount: float = Query(1.0, description="Amount of the component"),
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        tree = await get_tree(topName=topName, db=db, current_user=current_user)

        async def dfs_post_order_duration(node):
            if not node["children"]:
                delivery_duration = await _get_component_delivery_duration(node["name"], db)
                return 0.0, delivery_duration

            children_manufacturing_duration = 0.0
            max_delivery_duration = 0.0

            for child in node["children"]:
                child_manufacturing, child_delivery = await dfs_post_order_duration(child)
                children_manufacturing_duration += child_manufacturing * child["amount"]
                max_delivery_duration = max(max_delivery_duration, child_delivery)

            own_manufacturing_duration = await _get_component_duration(node["name"], db)
            total_manufacturing = children_manufacturing_duration + own_manufacturing_duration

            return total_manufacturing, max_delivery_duration

        total_manufacturing_duration, max_delivery_duration = await dfs_post_order_duration(tree["tree"])
        return {
            "total_manufacturing_duration": total_manufacturing_duration * amount,
            "max_delivery_duration": max_delivery_duration,
        }
    except RecordNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except OSError as e:
        raise HTTPException(status_code=400, detail=f"Could not retrieve component tree: {str(e)}")


@router.get("/bom-export", response_model=list)
async def get_bom_export(
    topName: str = Query(..., description="Top-level component name"),
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Return a flat BOM list for the given top component with per-stage labor costs."""
    async def dfs(node, depth: int, accumulated_amount: float = 1.0):
        """Post-order DFS. Returns (ordered_rows, subtree_material_per_unit, subtree_labor_per_unit).

        subtree_material_per_unit and subtree_labor_per_unit are the full recursive
        BOM costs for one unit of this node — the same breakdown that the inventory
        component shows via get_component_total_cost_detailed.
        """
        name = node["name"]
        amount = node["amount"]

        comp = await db.components.find_first(
            where={"componentName": name},
            include={
                "productionStages": {"include": {"laborProfile": True}},
                "manuals": True
            }
        )

        # Recurse into children first so we can roll their subtree costs up.
        children_rows: list = []
        children_subtree_material = 0.0
        children_subtree_labor = 0.0
        for child in node.get("children", []):
            child_rows, child_material_pu, child_labor_pu = await dfs(
                child, depth + 1, accumulated_amount * child["amount"]
            )
            children_rows.extend(child_rows)
            children_subtree_material += child_material_pu * child["amount"]
            children_subtree_labor += child_labor_pu * child["amount"]

        if comp is None:
            own_row = {
                "component_name": name,
                "depth": depth,
                "material_cost": 0.0,
                "labor_cost": 0.0,
                "total_cost": 0.0,
                "amount": amount,
                "min_amount": 0.0,
                "supplier": "",
                "type": "",
                "delivery_time": None,
                "location": None,
                "has_manual": False,
            }
            return [own_row] + children_rows, 0.0, 0.0

        own_material_pu = comp.cost
        own_labor_pu = sum(
            s.duration * s.laborProfile.hourlyRate
            for s in (comp.productionStages or [])
            if s.laborProfile
        )

        subtree_material_pu = own_material_pu + children_subtree_material
        subtree_labor_pu = own_labor_pu + children_subtree_labor

        own_row = {
            "component_name": comp.componentName,
            "depth": depth,
            "material_cost": subtree_material_pu * accumulated_amount,
            "labor_cost": subtree_labor_pu * accumulated_amount,
            "total_cost": (subtree_material_pu + subtree_labor_pu) * accumulated_amount,
            "amount": amount,
            "min_amount": comp.triggerMinAmount,
            "supplier": comp.supplier,
            "type": comp.type,
            "delivery_time": comp.delivery_time,
            "location": comp.location,
            "has_manual": len(comp.manuals or []) > 0,
        }

        # Parent row first (pre-order output), then children rows.
        return [own_row] + children_rows, subtree_material_pu, subtree_labor_pu

    tree = await get_tree(topName=topName, db=db, current_user=current_user)
    rows, _, _ = await dfs(tree["tree"], 0, 1.0)
    return rows


async def get_component_total_cost_detailed(
    topName: str,
    db: Prisma,
    current_user
):
    """Detailed cost breakdown used by the /analytics compat endpoint."""
    try:
        tree = await get_tree(topName=topName, db=db, current_user=current_user)

        total_material_cost = 0.0
        total_labor_cost = 0.0
        total_development_time = 0.0

        async def dfs_post_order_cost(node, accumulated_amount: float = 1.0):
            nonlocal total_material_cost, total_labor_cost, total_development_time

            children_cost = 0.0
            for child in node["children"]:
                child_cost = await dfs_post_order_cost(child, accumulated_amount * child["amount"])
                children_cost += child_cost * child["amount"]

            material_cost = await _get_component_cost(node["name"], db)
            development_time = await _get_component_duration(node["name"], db)
            labor_cost = await _get_component_labor_cost(node["name"], db)

            total_material_cost += material_cost * accumulated_amount
            total_labor_cost += labor_cost * accumulated_amount
            total_development_time += development_time * accumulated_amount

            return children_cost + material_cost + labor_cost

        total_calculated_cost = await dfs_post_order_cost(tree["tree"])

        return {
            "total_cost": total_calculated_cost,
            "material_cost": total_material_cost,
            "labor_cost": total_labor_cost,
            "total_development_time": total_development_time,
            "component_name": topName
        }

    except RecordNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not calculate component cost: {str(e)}")
