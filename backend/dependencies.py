from fastapi import Header, HTTPException, status

def get_current_user(x_user_email: str = Header(None, alias="X-User-Email")):
    if not x_user_email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-User-Email header. User must be authenticated."
        )
    return x_user_email
