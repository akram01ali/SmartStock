from datetime import datetime
from fastapi import FastAPI, APIRouter, Body, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from models import ComponentCreate

from config import (
    APP_TITLE, APP_VERSION, CORS_ORIGINS, CORS_CREDENTIALS, 
    CORS_METHODS, CORS_HEADERS, HOST, PORT
)
from controllers.database import connect_db, disconnect_db
from controllers import components, relationships, tree, graph, analytics
from controllers.auth import auth_routes

app = FastAPI(title=APP_TITLE, version=APP_VERSION)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=CORS_CREDENTIALS,
    allow_methods=CORS_METHODS,
    allow_headers=CORS_HEADERS,
)

# Include routers
app.include_router(auth_routes.router)
app.include_router(components.router)
app.include_router(relationships.router)
app.include_router(tree.router)
app.include_router(graph.router)
app.include_router(analytics.router)

# Add direct compatibility routes for frontend
from models import UserLogin, Token, Component, RelationshipCreate, Relationship, ComponentUpdate, UserCreate, CreateAppUser, ReturnUser, RelationshipRequest
from prisma import Prisma
from controllers.database import get_db
from controllers.auth.auth import get_current_user
from controllers.auth.models import User
from fastapi import Depends, Query
from typing import List, Optional

# Import the actual functions from controllers
from controllers.components import (
    get_printers, get_groups, get_assemblies, get_all_components, get_all_components_light_paginated, get_component, create_component as create_component_impl,
    update_component, delete_component, get_all_components_with_images_paginated, get_components_statistics,
    get_printers_groups_assemblies
)
from controllers.relationships import get_relationship, create_relationship, update_relationship, delete_relationship
from controllers.tree import get_tree
from controllers.graph import get_graph
from controllers.auth.auth_routes import login, app_login, register, app_register, get_current_user_info, logout
from controllers.stockupdate import update_component_stock_logic

@app.post("/login", response_model=Token)
async def login_compat(user_data: UserLogin, db: Prisma = Depends(get_db)):
    from controllers.auth.auth_routes import login
    return await login(user_data, db)

@app.get("/printers-groups-assemblies", response_model=List[Component])
async def get_printers_groups_assemblies_compat(
    db: Prisma = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return await get_printers_groups_assemblies(db, current_user)

@app.get("/printers", response_model=List[Component])
async def get_printers_compat(
    db: Prisma = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return await get_printers(db, current_user)

@app.get("/groups", response_model=List[Component])
async def get_groups_compat(
    db: Prisma = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return await get_groups(db, current_user)

@app.get("/assemblies", response_model=List[Component])
async def get_assemblies_compat(
    db: Prisma = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return await get_assemblies(db, current_user)

@app.get("/all_components", response_model=List[Component])
async def get_all_components_compat(
    db: Prisma = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return await get_all_components(db, current_user)

@app.get("/all_components_light_paginated", response_model=dict)
async def get_all_components_light_paginated_compat(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Prisma = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return await get_all_components_light_paginated(page, page_size, db, current_user)

@app.get("/search_components", response_model=dict)
async def search_components_compat(
    q: str = Query(..., description="Search query for component name"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    include_images: bool = Query(True, description="Include image field in response"),
    type_filter: Optional[str] = Query(None, description="Filter by component type"),
    db: Prisma = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    from controllers.components import search_components_light_paginated
    return await search_components_light_paginated(q, page, page_size, include_images, type_filter, db, current_user)

@app.get("/components/with-images-paginated", response_model=dict)
async def get_all_components_with_images_paginated_compat(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=50),
    include_empty_images: bool = Query(False),
    image_format: str = Query("url"),
    type_filter: Optional[str] = Query(None, description="Filter by component type"),
    db: Prisma = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return await get_all_components_with_images_paginated(page, page_size, include_empty_images, image_format, type_filter, db, current_user)

@app.get("/components/statistics", response_model=dict)
async def get_components_statistics_compat(
    q: Optional[str] = Query(None, description="Search query for component name"),
    type_filter: Optional[str] = Query(None, description="Filter by component type"),
    include_empty_images: bool = Query(True, description="Include components without images"),
    db: Prisma = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return await get_components_statistics(q, type_filter, include_empty_images, db, current_user)

@app.get("/all", response_model=List[Component])
async def get_all_compat(
    db: Prisma = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return await get_all_components(db, current_user)

@app.get("/component/{component_name}", response_model=Component)
async def get_component_compat(
    component_name: str,
    db: Prisma = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return await get_component(component_name, db, current_user)

@app.get("/relationships", response_model=dict)
async def get_relationship_compat(
    topComponent: str = Query(...),
    subComponent: str = Query(...),
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await get_relationship(topComponent, subComponent, db, current_user)

@app.post("/relationships", response_model=RelationshipRequest)
async def create_relationship_compat(
    relationship_data: RelationshipCreate = Body(...),
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await create_relationship(relationship_data, db, current_user)

@app.put("/relationships", response_model=Relationship)
async def update_relationship_compat(
    relationship_data: RelationshipCreate = Body(...),
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await update_relationship(relationship_data, db, current_user)

@app.delete("/relationships", response_model=dict)
async def delete_relationship_compat(
    topComponent: str = Query(...),
    subComponent: str = Query(...),
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await delete_relationship(topComponent, subComponent, db, current_user)

@app.get("/tree", response_model=dict)
async def get_tree_compat(
    topName: str = Query(...),
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await get_tree(topName, db, current_user)

@app.get("/graph", response_model=dict)
async def get_graph_compat(
    topName: str = Query(...),
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await get_graph(topName, db, current_user)

@app.on_event("startup")
async def startup():
    await connect_db()

@app.on_event("shutdown")
async def shutdown():
    await disconnect_db()

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "message": "SmartStock API is running",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/components", response_model=Component)
async def create_component_compat(
    root: str = Query(...),
    component: ComponentCreate = Body(...),
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):  
    return await create_component_impl(root, component, db, current_user)

@app.put("/components/{component_name}", response_model=Component)
async def update_component_compat(
    component_name: str,
    component_data: ComponentUpdate = Body(...),
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await update_component(component_name, component_data, db, current_user)

@app.delete("/components", response_model=Optional[Component])
async def delete_component_compat(
    componentName: str = Query(...),
    deleteOutOfDatabase: bool = Query(...),
    parent: str = Query(None),
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await delete_component(componentName, deleteOutOfDatabase, parent, db, current_user)

@app.post("/app-login", response_model=Token)
async def app_login_compat(
    request_data: dict = Body(...),
    db: Prisma = Depends(get_db)
):
    return await app_login(request_data["name"], request_data["surname"], request_data["password"], db)

@app.post("/register", response_model=dict)
async def register_compat(
    user_data: UserCreate = Body(...),
    db: Prisma = Depends(get_db)
):
    return await register(user_data, db)

@app.post("/app-register", response_model=ReturnUser)
async def app_register_compat(
    user_data: CreateAppUser = Body(...),
    db: Prisma = Depends(get_db)
):
    return await app_register(user_data, db)

@app.get("/me", response_model=dict)
async def get_current_user_info_compat(
    current_user: User = Depends(get_current_user)
):
    return await get_current_user_info(current_user)

@app.post("/logout", response_model=dict)
async def logout_compat():
    return await logout()

@app.post("/components/scan-update", response_model=Component)
async def scan_update_endpoint(
    component_name: str = Query(...),
    amount: float = Query(...),
    absolute: bool = Query(False),
    scannedBy: str = Query(""),
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await update_component_stock_logic(
        component_name=component_name,
        amount=amount,
        absolute=absolute,
        scannedBy=scannedBy,
        db=db,
        current_user=current_user
    )

@app.put("/components/{component_name}/stock", response_model=Component)
async def update_component_stock(
    component_name: str,
    amount: float = Query(...),
    absolute: bool = Query(False),
    scannedBy: str = Query("manual"),
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await update_component_stock_logic(
        component_name=component_name,
        amount=amount,
        absolute=absolute,
        scannedBy=scannedBy,
        db=db,
        current_user=current_user
    )

@app.get("/components/low-stock", response_model=dict)
async def get_low_stock_components(
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await get_low_stock_components(db, current_user)

@app.get("/low-stock", response_model=List[Component])
async def get_low_stock_components_compat(
    db: Prisma = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    from controllers.components import get_low_stock_components
    return await get_low_stock_components(db, current_user)


@app.get("/analytics", response_model=dict)
async def get_component_total_cost_compat(
    topName: str = Query(...),
    hourly_rate: float = Query(18.5, description="Hourly rate for cost calculation in EUR"),
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from controllers.analytics import get_component_total_cost
    return await get_component_total_cost(topName, hourly_rate, db, current_user)



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT)