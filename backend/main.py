from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
import json

app = FastAPI()

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# File to store transactions
DATA_FILE = Path(__file__).parent / "data" / "transactions.json"

# Pydantic model
class Transaction(BaseModel):
    id: int
    date: str
    type: str   # "income" or "expense"
    category: str
    amount: float
    note: str = ""

# Load transactions
def load_transactions():
    if DATA_FILE.exists():
        with open(DATA_FILE, "r") as f:
            return json.load(f)
    return []

# Save transactions
def save_transactions(transactions):
    with open(DATA_FILE, "w") as f:
        json.dump(transactions, f, indent=4)

# Routes
@app.get("/transactions")
def get_transactions():
    return load_transactions()

@app.post("/transactions")
def add_transaction(transaction: Transaction):
    transactions = load_transactions()
    transactions.append(transaction.dict())
    save_transactions(transactions)
    return {"message": "Transaction added successfully!"}

@app.put("/transactions/{id}")
def update_transaction(id: int, transaction: Transaction):
    transactions = load_transactions()
    for i, tx in enumerate(transactions):
        if tx["id"] == id:
            transactions[i] = transaction.dict()
            save_transactions(transactions)
            return {"message": "Transaction updated successfully!"}
    return {"message": "Transaction not found."}

@app.delete("/transactions/{id}")
def delete_transaction(id: int):
    transactions = [tx for tx in load_transactions() if tx["id"] != id]
    save_transactions(transactions)
    return {"message": "Transaction deleted successfully!"}