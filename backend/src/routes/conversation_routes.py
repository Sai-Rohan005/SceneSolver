from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime
import traceback

from config.config import get_mongo_connection
from middleware.auth import require_jwt as token_required
from model.conversation import Conversation
from model.case import Case

conversation_bp = Blueprint('conversation', __name__)
db = get_mongo_connection()

@conversation_bp.route('/message/<case_id>', methods=['POST'])
@token_required
def post_message(case_id):
    try:
        data = request.get_json()
        user_email = request.user['sub']  # Assumes JWT sets this via middleware

        text = data.get('text')
        sender_id = data.get('senderId', '')

        if not text:
            return jsonify({'error': 'Missing text'}), 400

        conversation = Conversation.find_by_case_id(case_id)
        if not conversation:
            return jsonify({'error': 'Conversation not found'}), 404

        # Resolve senderId using case logic
        case_obj = Case.find_by_id(case_id)
        if not case_obj:
            return jsonify({"error": "Case not found"}), 404

        if case_obj.get("officer") == user_email:
            sender_id = case_obj.get("email")
        else:
            sender_id = case_obj.get("officer")

        if not sender_id:
            return jsonify({'error': 'Could not resolve senderId from case'}), 400

        convo = Conversation(
            case_id=case_id,
            user_ids=conversation.get("userIds", ""),
            messages=conversation.get("messages", [])
        )

        success = convo.add_message(sender_id, text)

        if success:
            return jsonify({"message": "Message added"}), 200
        else:
            return jsonify({"error": "Failed to add message"}), 500

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500
    


@staticmethod
def convert_objectid_to_str(obj):
    if isinstance(obj, list):
        return [convert_objectid_to_str(item) for item in obj]
    elif isinstance(obj, dict):
        return {k: convert_objectid_to_str(v) for k, v in obj.items()}
    elif isinstance(obj, ObjectId):
        return str(obj)
    else:
        return obj

@conversation_bp.route('/conversations/<case_id>', methods=['GET'])
@token_required
def get_conversation(case_id):
    try:
        skip = max(int(request.args.get('skip', 0)), 0)
        limit = max(int(request.args.get('limit', 50)), 1)

        result = Conversation.get_paginated_messages(case_id, skip, limit)

        if not result:
            return jsonify({'messages': []}), 200

        # Convert ObjectIds to strings recursively
        result = convert_objectid_to_str(result)

        return jsonify({
            "mail": result["mail"],
            "messages": result["messages"],
            "hasMore": result["hasMore"]
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500
