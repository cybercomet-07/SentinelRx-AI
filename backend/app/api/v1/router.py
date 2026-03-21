from fastapi import APIRouter

from app.api.v1.endpoints.admin import router as admin_router
from app.api.v1.endpoints.ai_chat import router as ai_chat_router
from app.api.v1.endpoints.analytics import router as analytics_router
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.cart import router as cart_router
from app.api.v1.endpoints.health import router as health_router
from app.api.v1.endpoints.medicines import router as medicines_router
from app.api.v1.endpoints.notifications import router as notifications_router
from app.api.v1.endpoints.orders import router as orders_router
from app.api.v1.endpoints.prescriptions import router as prescriptions_router, admin_router as prescriptions_admin_router
from app.api.v1.endpoints.refill_alerts import router as refill_alerts_router
from app.api.v1.endpoints.call_schedules import router as call_schedules_router
from app.api.v1.endpoints.contact import router as contact_router
from app.api.v1.endpoints.doctor.router import router as doctor_router
from app.api.v1.endpoints.hospital.router import router as hospital_router
from app.api.v1.endpoints.ngo.router import router as ngo_router
from app.api.v1.endpoints.patient.router import router as patient_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(ai_chat_router)
api_router.include_router(admin_router)
api_router.include_router(analytics_router)
api_router.include_router(medicines_router)
api_router.include_router(cart_router)
api_router.include_router(notifications_router)
api_router.include_router(orders_router)
api_router.include_router(prescriptions_router)
api_router.include_router(prescriptions_admin_router)
api_router.include_router(refill_alerts_router)
api_router.include_router(call_schedules_router)
api_router.include_router(contact_router)
api_router.include_router(doctor_router)
api_router.include_router(hospital_router)
api_router.include_router(ngo_router)
api_router.include_router(patient_router)
