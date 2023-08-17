extends Node2D

export var size: Vector2 = Vector2(48, 48) setget set_size

func _ready():
	pass # Replace with function body.

func set_size(value: Vector2):
	size = value
	$NinePatchRect.rect_size = size
