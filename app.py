#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
工单标注系统 - Python后端
使用Flask提供RESTful API
"""
import os
import json
import csv
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})  # 允许跨域请求

# 全局错误处理
@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'message': '接口不存在'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'success': False, 'message': '服务器内部错误'}), 500

@app.errorhandler(Exception)
def handle_exception(e):
    print(f"未处理的异常: {e}")
    return jsonify({'success': False, 'message': f'服务器错误: {str(e)}'}), 500

# 文件路径
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TICKETS_FILE = os.path.join(BASE_DIR, 'tickets.csv')
LABELS_FILE = os.path.join(BASE_DIR, 'labels.json')
LABEL_COLORS_FILE = os.path.join(BASE_DIR, 'label_colors.json')

# 默认标签
DEFAULT_LABELS = ['训练', '预测', '故障']
DEFAULT_LABEL_COLORS = {
    '训练': '#1677ff',
    '预测': '#52c41a',
    '故障': '#f5222d',
    '未打标': '#d9d9d9'
}


def load_tickets():
    """加载工单数据"""
    if not os.path.exists(TICKETS_FILE):
        return []
    
    tickets = []
    try:
        with open(TICKETS_FILE, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                tickets.append({
                    'id': int(row.get('id', 0)),
                    'title': row.get('title', ''),
                    'content': row.get('content', ''),
                    'label': row.get('label', '').strip() or None
                })
    except Exception as e:
        print(f"加载工单失败: {e}")
        return []
    
    return tickets


def save_tickets(tickets):
    """保存工单数据到CSV"""
    try:
        with open(TICKETS_FILE, 'w', encoding='utf-8-sig', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=['id', 'title', 'content', 'label'])
            writer.writeheader()
            for ticket in tickets:
                writer.writerow({
                    'id': ticket['id'],
                    'title': ticket['title'],
                    'content': ticket['content'],
                    'label': ticket.get('label') or ''
                })
        return True
    except Exception as e:
        print(f"保存工单失败: {e}")
        return False


def load_labels():
    """加载标签列表"""
    if not os.path.exists(LABELS_FILE):
        return DEFAULT_LABELS.copy()
    
    try:
        with open(LABELS_FILE, 'r', encoding='utf-8') as f:
            labels = json.load(f)
            if isinstance(labels, list):
                return labels
    except Exception as e:
        print(f"加载标签失败: {e}")
    
    return DEFAULT_LABELS.copy()


def save_labels(labels):
    """保存标签列表"""
    try:
        # 确保默认标签存在
        for label in DEFAULT_LABELS:
            if label not in labels:
                labels.append(label)
        
        with open(LABELS_FILE, 'w', encoding='utf-8') as f:
            json.dump(labels, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"保存标签失败: {e}")
        return False


def load_label_colors():
    """加载标签颜色"""
    if not os.path.exists(LABEL_COLORS_FILE):
        return DEFAULT_LABEL_COLORS.copy()
    
    try:
        with open(LABEL_COLORS_FILE, 'r', encoding='utf-8') as f:
            colors = json.load(f)
            if isinstance(colors, dict):
                colors.update(DEFAULT_LABEL_COLORS)
                return colors
    except Exception as e:
        print(f"加载标签颜色失败: {e}")
    
    return DEFAULT_LABEL_COLORS.copy()


def save_label_colors(colors):
    """保存标签颜色"""
    try:
        colors.update(DEFAULT_LABEL_COLORS)
        with open(LABEL_COLORS_FILE, 'w', encoding='utf-8') as f:
            json.dump(colors, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"保存标签颜色失败: {e}")
        return False


def get_next_id(tickets):
    """获取下一个ID"""
    if not tickets:
        return 1001
    return max(t['id'] for t in tickets) + 1


@app.route('/')
def index():
    """返回前端页面"""
    return send_from_directory(BASE_DIR, 'index.html')


# 静态资源（app.js、styles.css、favicon 等）
@app.route('/<path:filename>')
def static_files(filename):
    """返回同目录下的静态资源文件"""
    return send_from_directory(BASE_DIR, filename)


@app.route('/api/tickets', methods=['GET'])
def get_tickets():
    """获取所有工单"""
    tickets = load_tickets()
    return jsonify({'success': True, 'data': tickets})


@app.route('/api/tickets', methods=['POST'])
def create_ticket():
    """创建新工单"""
    data = request.json
    tickets = load_tickets()
    
    new_id = get_next_id(tickets)
    new_ticket = {
        'id': new_id,
        'title': data.get('title', '').strip(),
        'content': data.get('content', '').strip(),
        'label': data.get('label', '').strip() or None
    }
    
    if not new_ticket['title'] or not new_ticket['content']:
        return jsonify({'success': False, 'message': '标题和内容不能为空'}), 400
    
    tickets.append(new_ticket)
    
    # 处理新标签
    if new_ticket['label']:
        labels = load_labels()
        if new_ticket['label'] not in labels:
            labels.append(new_ticket['label'])
            save_labels(labels)
    
    if save_tickets(tickets):
        return jsonify({'success': True, 'data': new_ticket})
    else:
        return jsonify({'success': False, 'message': '保存失败'}), 500


@app.route('/api/tickets/<int:ticket_id>/label', methods=['PUT'])
def update_ticket_label(ticket_id):
    """更新工单标签"""
    data = request.json
    label = data.get('label', '').strip() or None
    
    tickets = load_tickets()
    ticket = next((t for t in tickets if t['id'] == ticket_id), None)
    
    if not ticket:
        return jsonify({'success': False, 'message': '工单不存在'}), 404
    
    ticket['label'] = label
    
    # 处理新标签
    if label:
        labels = load_labels()
        if label not in labels:
            labels.append(label)
            save_labels(labels)
    
    if save_tickets(tickets):
        return jsonify({'success': True, 'data': ticket})
    else:
        return jsonify({'success': False, 'message': '保存失败'}), 500


@app.route('/api/tickets/import', methods=['POST'])
def import_tickets():
    """导入CSV工单"""
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': '未上传文件'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'message': '未选择文件'}), 400
    
    try:
        content = file.read().decode('utf-8-sig')
        lines = content.strip().split('\n')
        if not lines:
            return jsonify({'success': False, 'message': '文件为空'}), 400
        
        reader = csv.DictReader(lines)
        tickets = load_tickets()
        labels = load_labels()
        
        added = 0
        for row in reader:
            title = row.get('title', '').strip()
            content = row.get('content', '').strip()
            if not title or not content:
                continue
            
            label = row.get('label', '').strip() or None
            ticket_id_str = row.get('id', '').strip()
            
            # 处理ID
            if ticket_id_str and ticket_id_str.isdigit():
                ticket_id = int(ticket_id_str)
                # 检查ID是否已存在
                if any(t['id'] == ticket_id for t in tickets):
                    ticket_id = get_next_id(tickets)
            else:
                ticket_id = get_next_id(tickets)
            
            # 处理标签
            if label and label not in labels:
                labels.append(label)
            
            tickets.append({
                'id': ticket_id,
                'title': title,
                'content': content,
                'label': label
            })
            added += 1
        
        if added > 0:
            save_labels(labels)
            if save_tickets(tickets):
                return jsonify({'success': True, 'message': f'成功导入 {added} 条工单'})
            else:
                return jsonify({'success': False, 'message': '保存失败'}), 500
        else:
            return jsonify({'success': False, 'message': '未导入任何工单'}), 400
            
    except Exception as e:
        return jsonify({'success': False, 'message': f'导入失败: {str(e)}'}), 500


@app.route('/api/labels', methods=['GET'])
def get_labels():
    """获取所有标签"""
    labels = load_labels()
    colors = load_label_colors()
    return jsonify({'success': True, 'data': labels, 'colors': colors})


@app.route('/api/labels', methods=['POST'])
def create_label():
    """创建新标签"""
    data = request.json
    label_name = data.get('name', '').strip()
    
    if not label_name:
        return jsonify({'success': False, 'message': '标签名不能为空'}), 400
    
    labels = load_labels()
    if label_name in labels:
        return jsonify({'success': True, 'message': '标签已存在', 'data': label_name})
    
    labels.append(label_name)
    if save_labels(labels):
        return jsonify({'success': True, 'data': label_name})
    else:
        return jsonify({'success': False, 'message': '保存失败'}), 500


@app.route('/api/next-id', methods=['GET'])
def get_next_id_api():
    """获取下一个ID"""
    tickets = load_tickets()
    next_id = get_next_id(tickets)
    return jsonify({'success': True, 'data': next_id})


if __name__ == '__main__':
    # 初始化默认数据（如果文件不存在）
    if not os.path.exists(TICKETS_FILE):
        save_tickets([])
    if not os.path.exists(LABELS_FILE):
        save_labels(DEFAULT_LABELS.copy())
    if not os.path.exists(LABEL_COLORS_FILE):
        save_label_colors(DEFAULT_LABEL_COLORS.copy())
    
    print("工单标注系统后端启动...")
    print(f"前端访问: http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)

