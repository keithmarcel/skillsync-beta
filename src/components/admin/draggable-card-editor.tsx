'use client';

import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { GripVertical, X, Plus, Edit2 } from 'lucide-react';

interface SortableItemProps {
  id: string;
  item: string;
  index: number;
  isEditing: boolean;
  editValue: string;
  onEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onEditValueChange: (value: string) => void;
}

function SortableItem({
  id,
  item,
  index,
  isEditing,
  editValue,
  onEdit,
  onSave,
  onDelete,
  onEditValueChange,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (editValue.trim()) {
        onSave();
      }
    } else if (e.key === 'Escape') {
      if (editValue.trim()) {
        onSave();
      }
    }
  };

  const handleBlur = () => {
    // Only save if there's actual content
    if (editValue.trim()) {
      onSave();
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-4 ${
        isEditing ? 'ring-2 ring-teal-500' : ''
      } hover:shadow-md transition-all`}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        {!isEditing && (
          <button
            className="cursor-grab active:cursor-grabbing touch-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
          </button>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <Textarea
              value={editValue}
              onChange={(e) => onEditValueChange(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder="Enter text..."
              className="min-h-[80px]"
              autoFocus
            />
          ) : (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{item}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isEditing ? (
            <Button
              type="button"
              size="sm"
              onClick={onSave}
              disabled={!editValue.trim()}
              className="gap-1 bg-teal-600 hover:bg-teal-700 text-white"
            >
              Done
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="gap-1"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
          {!isEditing && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

interface DraggableCardEditorProps {
  items: string[];
  onChange: (items: string[]) => void;
  title: string;
  description?: string;
  placeholder?: string;
  maxItems?: number;
}

export function DraggableCardEditor({
  items = [],
  onChange,
  title,
  description,
  placeholder = 'Enter text...',
  maxItems = 20,
}: DraggableCardEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((_, i) => `item-${i}` === active.id);
      const newIndex = items.findIndex((_, i) => `item-${i}` === over.id);
      onChange(arrayMove(items, oldIndex, newIndex));
    }
  };

  const handleAdd = () => {
    if (items.length >= maxItems) return;
    onChange([...items, '']);
    setEditingIndex(items.length);
    setEditValue('');
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(items[index]);
  };

  const handleSave = (index: number) => {
    if (!editValue.trim()) return;
    const newItems = [...items];
    newItems[index] = editValue.trim();
    onChange(newItems);
    setEditingIndex(null);
    setEditValue('');
  };

  const handleDelete = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditValue('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={items.length >= maxItems}
          className="gap-2 flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <p className="text-sm text-gray-500 mb-2">No items yet</p>
          <p className="text-xs text-gray-400">Click "Add Item" to get started</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((_, i) => `item-${i}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {items.map((item, index) => (
                <SortableItem
                  key={`item-${index}`}
                  id={`item-${index}`}
                  item={item}
                  index={index}
                  isEditing={editingIndex === index}
                  editValue={editValue}
                  onEdit={() => handleEdit(index)}
                  onSave={() => handleSave(index)}
                  onDelete={() => handleDelete(index)}
                  onEditValueChange={setEditValue}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Item Count */}
      <div className="text-xs text-gray-500 text-right">
        {items.length} / {maxItems} items
      </div>
    </div>
  );
}
