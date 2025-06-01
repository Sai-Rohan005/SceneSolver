from datetime import datetime
from bson import ObjectId
from config.config import get_mongo_connection

mongo = get_mongo_connection()

class Conversation:
    def __init__(self, case_id, user_ids, messages=None):
        self.case_id = case_id
        self.userIds = user_ids  # Store as a string like in Mongoose
        self.messages = messages if messages else []

    def save(self):
        conversation_data = {
            "_id": ObjectId(),
            "case_id": self.case_id,
            "userIds": self.userIds,
            "messages": self.messages
        }
        mongo.db.conversations.insert_one(conversation_data)
        return conversation_data["_id"]

    def add_message(self, sender_id, text):
        message = {
            "index": len(self.messages),  # optional if needed
            "senderId": sender_id,
            "text": text,
            "timestamp": datetime.utcnow()
        }

        result = mongo.db.conversations.update_one(
            {"case_id": self.case_id},
            {"$push": {"messages": message}}
        )
        return result.modified_count > 0

    @staticmethod
    def find_by_case_id(case_id):
        return mongo.db.conversations.find_one({"case_id": case_id})

    @staticmethod
    def get_paginated_messages(case_id, skip=0, limit=50):
        conversation = mongo.db.conversations.find_one({"case_id": case_id})
        if not conversation:
            return None

        total_messages = len(conversation["messages"])
        start = max(total_messages - skip - limit, 0)
        end = total_messages - skip

        paginated_messages = conversation["messages"][start:end]
        return {
            "mail": conversation.get("userIds"),
            "messages": paginated_messages,
            "hasMore": start > 0
        }
