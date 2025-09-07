from datetime import datetime
from typing import List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from prisma import Prisma
from prisma.enums import ReservationStatus, TypeOfComponent

from .auth.auth import get_current_user
from .auth.models import User
from .database import get_db
from .tree import build_tree_recursive

router = APIRouter(prefix="/forecasting", tags=["forecasting"])

# Basic reservation models
class ReservationCreate:
    def __init__(self, componentName: str, quantity: float, priority: int, 
                 neededByDate: Optional[datetime] = None):
        self.componentName = componentName
        self.quantity = quantity
        self.priority = priority
        self.neededByDate = neededByDate

@router.post("/reservations")
async def create_reservation(
    title: str = Query(...),
    componentName: str = Query(...),
    quantity: float = Query(..., gt=0),
    priority: int = Query(..., ge=1, le=10),
    neededByDate: Optional[datetime] = Query(None),
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Generate a single ID for the entire BOM explosion
    import secrets
    import string
    # Generate a short unique ID similar to cuid format
    reservation_id = ''.join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(20))
    
    # Create root reservation
    root_reservation = await db.reservations.create({
        "id": reservation_id,
        "isRoot": True,  # Mark this as the root reservation
        "level": 0,  # Root level is 0
        "title": title,
        "componentName": componentName,
        "quantity": quantity,
        "priority": priority,
        "requestedBy": current_user.username,
        "neededByDate": neededByDate
    })
    
    # Explode BOM using the same ID for all components
    await explode_bom_smart(reservation_id, componentName, quantity, db)
    
    # Process allocations
    await process_allocations(db)
    
    return {"id": reservation_id, "status": "created"}

@router.get("/reservations")
async def get_reservations(
    status: Optional[ReservationStatus] = Query(None),
    include_children: bool = Query(False, description="Include child reservations from BOM explosion"),
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    where_clause = {}
    if status:
        where_clause["status"] = status
    
    # By default, only show root reservations
    if not include_children:
        where_clause["isRoot"] = True
    
    reservations = await db.reservations.find_many(
        where=where_clause,
        order={"priority": "asc"}
    )
    return reservations

@router.get("/reservations/{reservation_id}/breakdown")
async def get_reservation_breakdown(
    reservation_id: str,
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get all reservations with this ID (all components in the BOM explosion)
    reservations = await db.reservations.find_many(
        where={"id": reservation_id}
    )
    
    return {"reservationId": reservation_id, "breakdown": reservations}

@router.get("/availability/{component_name}")
async def check_availability(
    component_name: str,
    quantity: float = Query(..., gt=0),
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get current stock
    component = await db.components.find_unique(
        where={"componentName": component_name}
    )
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")
    
    # Get already allocated amounts - calculate manually since aggregate isn't supported
    allocations = await db.reservationallocations.find_many(
        where={"componentName": component_name}
    )
    
    total_allocated = sum(allocation.allocatedQuantity for allocation in allocations)
    available = component.amount - total_allocated
    can_fulfill = available >= quantity
    
    return {
        "componentName": component_name,
        "requestedQuantity": quantity,
        "currentStock": component.amount,
        "alreadyAllocated": total_allocated,
        "availableStock": available,
        "canFulfill": can_fulfill,
        "shortfall": max(0, quantity - available)
    }

@router.get("/reservations/{reservation_id}/allocations")
async def get_reservation_allocations(
    reservation_id: str,
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    allocations = await db.reservationallocations.find_many(
        where={"reservationId": reservation_id}
    )
    return allocations

@router.get("/purchase-requirements")
async def get_purchase_requirements(
    status: str = Query("pending"),
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    requirements = await db.purchaserequirements.find_many(
        where={"status": status},
        order={"neededByDate": "asc"}
    )
    return requirements

@router.post("/process-allocations")
async def trigger_allocation_processing(
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await process_allocations(db)
    return {"status": "allocations processed"}

@router.delete("/reservations/{reservation_id}")
async def delete_reservation(
    reservation_id: str,
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a reservation and all its child reservations"""
    try:
        # First, check if the reservation exists
        reservation = await db.reservations.find_first(where={"id": reservation_id})
        if not reservation:
            raise HTTPException(status_code=404, detail="Reservation not found")
        
        # Delete all child reservations (those with the same root ID)
        await db.reservations.delete_many(where={"id": reservation_id})
        
        # Delete associated allocations
        await db.reservationallocations.delete_many(where={"reservationId": reservation_id})
        
        return {"status": "reservation deleted successfully", "deleted_id": reservation_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete reservation: {str(e)}")

# Internal functions
async def explode_bom_smart(reservation_id: str, component_name: str, quantity: float, db: Prisma):
    """
    Smart BOM explosion that checks stock first and only explodes shortfall.
    Stock-aware at every level of the BOM.
    
    Example:
    Want 50 of "parent" (stock: 20) -> need to manufacture 30
    parent BOM: 1x child1, 1x child2 per parent
    child1 (stock: 10) -> need to manufacture 20 of child1 
    Result: Create reservations considering stock at each level
    """
    print(f"Starting BOM explosion for {component_name} (requested: {quantity})")
    
    # Get the component details
    component = await db.components.find_unique(
        where={"componentName": component_name}
    )
    
    if not component:
        print(f"Warning: Component {component_name} not found in database")
        return
    
    # If it's a basic component, no BOM explosion needed
    if component.type == 'component':
        print(f"Component {component_name} is a basic component - no BOM explosion needed")
        return
    
    # Check current stock vs demand
    current_stock = component.amount
    print(f"Component {component_name}: requested={quantity}, stock={current_stock}")
    
    # If we have enough stock, no need to manufacture anything
    if current_stock >= quantity:
        print(f"Sufficient stock for {component_name} - no manufacturing needed")
        return
    
    # Calculate how much we need to manufacture
    need_to_manufacture = quantity - current_stock
    print(f"Need to manufacture {need_to_manufacture} units of {component_name}")
    
    # Build the complete BOM tree using existing tree logic
    try:
        tree = await build_tree_recursive(component_name, db)
        print(f"Built tree for {component_name}: {tree.name}")
        
        # Check if tree has any children
        if not tree.children:
            print(f"Warning: {component_name} (type: {component.type}) has no sub-components defined in BOM")
            return
        
        # Flatten the tree into component requirements, being stock-aware at each level
        component_requirements = {}
        await flatten_tree_requirements_stock_aware(tree, need_to_manufacture, component_requirements, db, level=0, is_root=True)
        
        # Create reservations for all required components (excluding root)
        for comp_name, requirement_info in component_requirements.items():
            if comp_name != component_name:  # Skip root component
                reservation = await db.reservations.create({
                    "id": reservation_id,
                    "isRoot": False,
                    "level": requirement_info["level"],
                    "title": f"Sub-component for manufacturing {comp_name}",
                    "componentName": comp_name,
                    "quantity": requirement_info["total_quantity"],
                    "priority": 0,
                    "requestedBy": "system",
                    "status": "pending"
                })
                print(f"Created aggregated reservation: {comp_name} (total quantity: {requirement_info['total_quantity']}, level: {requirement_info['level']})")
        
        print(f"Completed BOM explosion for {component_name} (manufacturing: {need_to_manufacture})")
        print(f"Total unique components required: {len(component_requirements) - 1}")  # -1 to exclude root
        
    except Exception as e:
        print(f"Error building tree for {component_name}: {str(e)}")
        return

async def flatten_tree_requirements_stock_aware(tree_node, parent_quantity: float, requirements: dict, db: Prisma, level: int = 0, is_root: bool = False):
    """
    Flatten tree into component requirements, being stock-aware at every level.
    
    Args:
        tree_node: Current tree node
        parent_quantity: Quantity needed at parent level (how many of the parent we're making)
        requirements: Dictionary to accumulate requirements {component_name: {"total_quantity": float, "level": int}}
        db: Database connection for stock checks
        level: Current tree level
        is_root: Whether this is the root node
    """
    if not is_root:
        # Calculate total quantity needed for this component
        total_quantity_needed = parent_quantity * tree_node.amount
        
        # Get current stock for this component
        component = await db.components.find_unique(where={"componentName": tree_node.name})
        current_stock = component.amount if component else 0
        
        # Calculate how much we actually need to manufacture/procure
        shortfall = max(0, total_quantity_needed - current_stock)
        
        print(f"Component {tree_node.name}: need {total_quantity_needed}, stock {current_stock}, shortfall {shortfall}")
        
        # Add to requirements, aggregating if component already exists
        if tree_node.name in requirements:
            # Component already exists - add to total quantity and use minimum level
            requirements[tree_node.name]["total_quantity"] += total_quantity_needed
            requirements[tree_node.name]["level"] = min(requirements[tree_node.name]["level"], level)
            print(f"Aggregating {tree_node.name}: +{total_quantity_needed} = {requirements[tree_node.name]['total_quantity']} total")
        else:
            # New component
            requirements[tree_node.name] = {
                "total_quantity": total_quantity_needed,
                "level": level
            }
            print(f"New requirement: {tree_node.name} = {total_quantity_needed} at level {level}")
        
        # For children, we only need to manufacture the shortfall amount
        # If we have enough stock, no need to explode this branch further
        if shortfall > 0:
            child_parent_quantity = shortfall
            print(f"Need to manufacture {shortfall} of {tree_node.name}, exploding children")
        else:
            print(f"Sufficient stock for {tree_node.name}, skipping children")
            return  # No need to process children if we have enough stock
            
    else:
        # For root node, add it to requirements but children use original parent_quantity
        requirements[tree_node.name] = {
            "total_quantity": parent_quantity,
            "level": level
        }
        child_parent_quantity = parent_quantity
        print(f"Root requirement: {tree_node.name} = {parent_quantity} at level {level}")
    
    # Process all children with the correct parent quantity (shortfall for manufacturing)
    for child in tree_node.children:
        await flatten_tree_requirements_stock_aware(child, child_parent_quantity, requirements, db, level + 1, is_root=False)

async def process_allocations(db: Prisma):
    """
    Process all allocations with proper priority handling and purchase requirement generation.
    """
    print("Starting allocation processing...")
    
    # Clear existing allocations and purchase requirements
    await db.reservationallocations.delete_many()
    await db.purchaserequirements.delete_many(where={"status": "pending"})
    
    # Get all pending reservations ordered by priority
    reservations = await db.reservations.find_many(
        where={"status": "pending"},
        order={"priority": "asc"}
    )
    
    print(f"Processing {len(reservations)} reservations")
    
    # Group reservations by component
    component_demands = {}
    for reservation in reservations:
        if reservation.componentName not in component_demands:
            component_demands[reservation.componentName] = []
        component_demands[reservation.componentName].append(reservation)
    
    # Process each component's demands
    for component_name, demands in component_demands.items():
        await allocate_component_stock(component_name, demands, db)
    
    print("Allocation processing completed")

async def allocate_component_stock(component_name: str, demands: List, db: Prisma):
    """
    Allocate available stock to demands and create purchase requirements for shortfalls.
    
    Logic:
    1. All reservations (root and child) compete for available stock
    2. Root reservations get priority in allocation
    3. Purchase requirements are created for shortfalls of leaf components only
    """
    # Get component details
    component = await db.components.find_unique(
        where={"componentName": component_name}
    )
    
    if not component:
        print(f"Warning: Component {component_name} not found during allocation")
        return
    
    # Separate root and child reservations for priority ordering
    root_demands = [d for d in demands if d.isRoot]
    child_demands = [d for d in demands if not d.isRoot]
    
    available_stock = component.amount
    total_root_demand = sum(demand.quantity for demand in root_demands)
    total_child_demand = sum(demand.quantity for demand in child_demands)
    
    print(f"Allocating {component_name}: stock={available_stock}")
    print(f"  Root demands: {total_root_demand} (from {len(root_demands)} reservations)")
    print(f"  Child demands: {total_child_demand} (from {len(child_demands)} reservations)")
    
    # Sort demands: root reservations by priority first, then child reservations by creation time
    all_demands_sorted = (
        sorted(root_demands, key=lambda x: (x.priority, x.createdAt)) +
        sorted(child_demands, key=lambda x: x.createdAt)
    )
    
    total_shortfall = 0
    
    # Allocate stock to ALL demands in priority order
    for i, demand in enumerate(all_demands_sorted):
        allocated = min(demand.quantity, available_stock)
        shortfall = demand.quantity - allocated
        
        await db.reservationallocations.create({
            "reservationId": demand.id,
            "componentName": component_name,
            "allocatedQuantity": allocated,
            "shortfallQuantity": shortfall,
            "allocationOrder": i + 1
        })
        
        available_stock -= allocated
        total_shortfall += shortfall
        
        allocation_type = "root" if demand.isRoot else "child"
        print(f"  {allocation_type} allocation {demand.id}: {allocated} from stock (shortfall: {shortfall})")
    
    # Create purchase requirement for shortfalls of leaf components only
    if total_shortfall > 0:
        await create_purchase_requirement_if_needed(component_name, total_shortfall, demands, db)

async def create_purchase_requirement_if_needed(component_name: str, shortfall_quantity: float, demands: List, db: Prisma):
    """
    Create purchase requirement only for components that cannot be manufactured.
    A component can be manufactured if:
    1. It has sub-components in the BOM (relationships exist)
    2. It's not of type 'component'
    """
    # Get component details
    component = await db.components.find_unique(
        where={"componentName": component_name}
    )
    
    if not component:
        return
    
    # Check if this component has sub-components (BOM relationships)
    relationships = await db.relationships.find_many(
        where={"topComponent": component_name}
    )
    
    has_subcomponents = len(relationships) > 0
    
    # Component can be manufactured if it has sub-components AND is not a basic 'component' type
    can_be_manufactured = has_subcomponents and component.type != 'component'
    
    print(f"Purchase requirement check for {component_name}:")
    print(f"  Type: {component.type}, Has subcomponents: {has_subcomponents}, Can be manufactured: {can_be_manufactured}")
    
    # Only create purchase requirements for components that can't be manufactured
    if not can_be_manufactured:
        # Calculate earliest needed date
        earliest_date = None
        for demand in demands:
            if demand.neededByDate:
                if earliest_date is None or demand.neededByDate < earliest_date:
                    earliest_date = demand.neededByDate
        
        if earliest_date is None:
            from datetime import datetime, timedelta
            earliest_date = datetime.now() + timedelta(days=30)  # Default 30 days from now
        
        # Check if purchase requirement already exists
        existing = await db.purchaserequirements.find_first(
            where={"componentName": component_name, "status": "pending"}
        )
        
        if existing:
            # Update existing requirement
            await db.purchaserequirements.update(
                where={"id": existing.id},
                data={
                    "requiredQuantity": existing.requiredQuantity + shortfall_quantity,
                    "neededByDate": min(existing.neededByDate, earliest_date)
                }
            )
            print(f"Updated purchase requirement for {component_name}: +{shortfall_quantity}")
        else:
            # Create new purchase requirement
            await db.purchaserequirements.create({
                "componentName": component_name,
                "requiredQuantity": shortfall_quantity,
                "neededByDate": earliest_date,
                "status": "pending"
            })
            print(f"Created purchase requirement for {component_name}: {shortfall_quantity}")
    else:
        print(f"Skipping purchase requirement for {component_name} (can be manufactured)")

async def recalculate_allocations_for_component(component_name: str, db: Prisma):
    # Delete existing allocations for this component
    await db.reservationallocations.delete_many(
        where={"componentName": component_name}
    )
    
    # Get demands for this component
    demands = await db.reservations.find_many(
        where={"componentName": component_name, "status": "pending"},
        order={"priority": "asc"}
    )
    
    await allocate_component_stock(component_name, demands, db)
