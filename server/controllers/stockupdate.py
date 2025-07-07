from datetime import datetime
from fastapi import HTTPException, UploadFile
from prisma import Prisma
from controllers.auth.models import User
from models import Component
from pyzbar import pyzbar
from PIL import Image
import io


async def scan_and_update_component_logic(
    image: UploadFile,
    amount: float,
    absolute: bool = False,
    scannedBy: str = "mobile-app",
    db: Prisma = None,
    current_user: User = None
) -> Component:
    try:
        # Read the QR code
        image_data = await image.read()
        
        if len(image_data) == 0:
            raise HTTPException(status_code=400, detail="Image data is empty")
        
        # Convert to PIL Image
        try:
            pil_image = Image.open(io.BytesIO(image_data))
        except Exception as pil_error:
            raise HTTPException(status_code=400, detail=f"Could not process image: {pil_error}")
        
        # Decode QR code
        barcodes = pyzbar.decode(pil_image)
        
        if not barcodes:
            raise HTTPException(
                status_code=400,
                detail="No barcode found in the image. Please ensure the barcode/QR code is clearly visible and well-lit."
            )
        
        # Use the first barcode found
        barcode_data = barcodes[0].data.decode('utf-8')
        
        # Use the existing update_component_stock function
        updated_component = await update_component_stock_logic(
            component_name=barcode_data,
            amount=amount,
            absolute=absolute,
            scannedBy=scannedBy,
            db=db,
            current_user=current_user
        )
        
        return updated_component
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Could not process barcode scan: {str(e)}"
        )


async def update_component_stock_logic(
    component_name: str,
    amount: float,
    absolute: bool = False,
    scannedBy: str = "manual",
    db: Prisma = None,
    current_user: User = None
) -> Component:

    try:
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

        # Error handling should still be implemented here:
        if new_amount < 0:
            new_amount = 0

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

                # Calculate the new amount for the component
                current_amount = subcomp_data.amount
                relationship_amount = subcomp.amount
                new_amount = current_amount - relationship_amount*amount

                # Error Handling should be implemented in the if-statement below:
                if new_amount<0:
                    pass

                # Update the amount for each subcomponent
                await db.components.update(
                    where={
                        "componentName": subcomp.subComponent
                    },
                    data={
                        "amount": new_amount
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
