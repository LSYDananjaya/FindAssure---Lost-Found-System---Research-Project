"""Pydantic schema for adding found items to the semantic index."""

from pydantic import BaseModel

class ItemCreate(BaseModel):
    id: str
    description: str
    category: str
