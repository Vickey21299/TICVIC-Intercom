from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str
    workspace_id: str


class AuthResponse(BaseModel):
    success: bool
    message: str
    user: UserResponse | None = None
