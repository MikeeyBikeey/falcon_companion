extends Sprite

export var GRAVITY_MAX: float = 300.0
export var GRAVITY: float = 750.0

var velocity: Vector2 = Vector2.ZERO

func _process(delta):
	velocity.y = move_toward(velocity.y, GRAVITY_MAX, GRAVITY * delta)
	position += velocity * delta
