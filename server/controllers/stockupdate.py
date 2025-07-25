from datetime import datetime
from fastapi import HTTPException
from prisma import Prisma
from controllers.auth.models import User
from models import Component




async def update_component_stock_logic(
    component_name: str,
    amount: float,
    absolute: bool = False,
    scannedBy: str = "",
    db: Prisma = None,
    current_user: User = None
) -> Component:

    try:
        # Validate input
        if not component_name or not component_name.strip():
            raise HTTPException(status_code=400, detail="Component name cannot be empty")
        
        component = await db.components.find_unique(
            where={"componentName": component_name}
        )
        
        if not component:
            raise HTTPException(
                status_code=404,
                detail=f"Component '{component_name}' not found"
            )
        
        # Calculate the current amount
        new_amount = amount if absolute else component.amount + amount

        # Validate new amount
        if new_amount < 0:
            if absolute:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Cannot set negative stock amount: {new_amount}"
                )
            else:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Insufficient stock. Current: {component.amount}, Requested change: {amount}"
                )

        # Update the current amount for the component
        updated_component = await db.components.update(
            where={"componentName": component_name},
            data={
                "amount": new_amount,
                "lastScanned": datetime.utcnow(),
                "scannedBy": scannedBy
            }
        )

        # If an assembly is increased, decrease the subcomponents that were used to create it:
        if not absolute and amount > 0:
            # Retrieve all the subcomponents for the component
            subcomponents = await db.relationships.find_many(
                where={"topComponent": component_name}
            )

            # Iterate over all the subcomponents to update them in the database
            for subcomp in subcomponents:
                # We need the current amount for each subcomponent 
                subcomp_data = await db.components.find_first(
                    where={
                        "componentName": subcomp.subComponent
                    }
                )

                if not subcomp_data:
                    continue

                # Calculate the new amount for the component
                current_amount = subcomp_data.amount
                relationship_amount = subcomp.amount
                new_subcomp_amount = current_amount - relationship_amount*amount

                # Warn but don't fail if subcomponent goes negative
                if new_subcomp_amount < 0:
                    new_subcomp_amount = 0

                # Update the amount for each subcomponent
                await db.components.update(
                    where={
                        "componentName": subcomp.subComponent
                    },
                    data={
                        "amount": new_subcomp_amount
                    }
                )

        
        return updated_component
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Could not update component stock: {str(e)}"
        )
