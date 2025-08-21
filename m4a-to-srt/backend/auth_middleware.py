import os
from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import logging
from firebase_config import verify_firebase_token, get_user_data, can_user_convert

logger = logging.getLogger(__name__)

# Create HTTPBearer instance
security = HTTPBearer(auto_error=False)

# Admin email from environment variable
ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', 'your-admin-email@example.com')

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """Get current authenticated user"""
    if not credentials:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )
    
    # Verify Firebase token
    user_info = await verify_firebase_token(credentials.credentials)
    if not user_info:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token"
        )
    
    return user_info

async def get_user_with_permissions(user_info: dict = Depends(get_current_user)):
    """Get user info with permissions and usage data"""
    uid = user_info.get('uid')
    email = user_info.get('email')
    
    if not uid or not email:
        raise HTTPException(
            status_code=401,
            detail="Invalid user information"
        )
    
    # Check if user is admin
    is_admin = email == ADMIN_EMAIL
    
    # Get user data from Firestore
    user_data = await get_user_data(uid)
    
    # If user data doesn't exist, create default data
    if not user_data:
        user_data = {
            'email': email,
            'conversionsUsed': 0,
            'isAdmin': is_admin,
            'createdAt': None
        }
    
    # Check if user can convert
    can_convert = can_user_convert(user_data, is_admin)
    
    return {
        'uid': uid,
        'email': email,
        'is_admin': is_admin,
        'user_data': user_data,
        'can_convert': can_convert
    }

async def require_conversion_access(user_permissions: dict = Depends(get_user_with_permissions)):
    """Require that user has access to conversion service"""
    if not user_permissions['can_convert']:
        raise HTTPException(
            status_code=403,
            detail="You have reached your free conversion limit. Please upgrade to continue."
        )
    
    return user_permissions

# Optional middleware for endpoints that don't require auth
async def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """Get current user if authenticated, otherwise return None"""
    if not credentials:
        return None
    
    try:
        user_info = await verify_firebase_token(credentials.credentials)
        return user_info
    except Exception as e:
        logger.warning(f"Optional auth failed: {e}")
        return None
