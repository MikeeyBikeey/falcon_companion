extends "res://entity/entity.gd"

const Hyperlink := preload("res://level/hyperlink/hyperlink.gd")

export var FRICTION: float = 500.0
export var ACCELERATION: float = 400.0
export var MAX_WALK_SPEED: float = 100.0
export var MAX_RUN_SPEED: float = 200.0
export var GRAVITY_MAX: float = 200.0
export var GRAVITY: float = 750.0
export var GRAVITY_UP_WITHOUT_HOLD_JUMP: float = 1400.0
export var GRAVITY_ON_HOLD_JUMP: float = 500.0
export var JUMP_IMPULSE: float = 300.0

onready var jump_audio = $JumpAudio
onready var enter_hyperlink_audio = $EnterHyperlinkAudio

var actions = {
	move_left = false,
	move_right = false,
	jump = false,
	crouch = false,
	run = false,
	use_power = false,
	pass_platform = false,
}
var is_onground := false
var jumped_since_press := false
var standing_on: Node2D
var respawn_timer: float = 3.0
var is_crouching := false
var enter_hyperlink_timer: float = 1.0

onready var sprite := $AnimatedSprite

signal died()
signal enter_hyperlink(hyperlink)

func _ready():
	pass # Replace with function body.

func respawn():
	clear_inputs()
	velocity = Vector2.ZERO

func clear_inputs():
	for action in actions.keys():
		actions[action] = false

func kill():
	emit_signal("died")

func _process(delta):
	# GRAVITY
	
	if !is_onground:
		if actions.jump:
			velocity.y = move_toward(velocity.y, GRAVITY_MAX, GRAVITY_ON_HOLD_JUMP * delta)
		else:
			if velocity.y < 0.0:
				velocity.y = move_toward(velocity.y, GRAVITY_MAX, GRAVITY_UP_WITHOUT_HOLD_JUMP * delta)
			else:
				velocity.y = move_toward(velocity.y, GRAVITY_MAX, GRAVITY * delta)
	
	# INPUT AND VELOCITY
	
	var input_vel_x: float = 0.0
	if actions.move_left:
		input_vel_x -= 1.0
	if actions.move_right:
		input_vel_x += 1.0
	
	if input_vel_x != 0.0:
		if actions.run:
			velocity.x = move_toward(velocity.x, input_vel_x * MAX_RUN_SPEED, ACCELERATION * delta)
		else:
			velocity.x = move_toward(velocity.x, input_vel_x * MAX_WALK_SPEED, ACCELERATION * delta)
	else:
		velocity.x = move_toward(velocity.x, 0, FRICTION * delta)
	
	var pre_position := position
	position += velocity * delta
	
	# LAND ON GROUND
	
	if !is_onground && velocity.y > 0:
		var platforms := get_tree().get_nodes_in_group("platform")
		for platform in platforms:
			if pre_position.y <= platform.position.y && position.y > platform.position.y:
				var WIDTH: float = 8.0
				var left_side = position.x - WIDTH 
				var right_side = position.x + WIDTH 
				var left_side_is_within: bool = left_side > platform.position.x && left_side < platform.position.x + platform.size.x
				var right_side_is_within: bool = right_side > platform.position.x && right_side < platform.position.x + platform.size.x
				if left_side_is_within || right_side_is_within:
					if platform is Hyperlink || !actions.pass_platform:
						is_onground = true
						standing_on = platform
						velocity.y = 0
						position.y = platform.position.y
						break
	
	# DISABLE JUMP UPON HOLD
	
	if !actions.jump:
		jumped_since_press = false
	
	# JUMP
	
	if is_onground && actions.jump && !jumped_since_press:
		jumped_since_press = true
		is_onground = false
		standing_on = null
		velocity.y = min(velocity.y, -JUMP_IMPULSE)
		jump_audio.play()
	
	# CROUCH
	
	var was_crouching = is_crouching
	is_crouching = actions.crouch && is_onground && input_vel_x == 0.0
	
	# ANIMATIONS
	
	if !is_onground:
		sprite.animation = 'jump'
	elif input_vel_x != 0.0:
		if sign(input_vel_x) != sign(velocity.x):
			sprite.animation = 'skid'
		else:
			sprite.animation = 'run'
	elif is_crouching:
		sprite.animation = 'crouch'
	else:
		sprite.animation = 'idle'
	
	if input_vel_x != 0.0:
		sprite.flip_h = input_vel_x < 0
	
	# FALL OFF PLATFORM
	
	if standing_on != null && is_instance_valid(standing_on):
		var WIDTH: float = 8.0
		var platform := standing_on
		var left_side = position.x - WIDTH 
		var right_side = position.x + WIDTH 
		var left_side_is_within: bool = left_side > platform.position.x && left_side < platform.position.x + platform.size.x
		var right_side_is_within: bool = right_side > platform.position.x && right_side < platform.position.x + platform.size.x
		if !(left_side_is_within || right_side_is_within):
			is_onground = false
			standing_on = null
	
	# ENTER HYPERLINK
	
	# resets enter timer
	if is_crouching && !was_crouching:
		enter_hyperlink_timer = 1.0
	
	if standing_on is Hyperlink && is_crouching:
		enter_hyperlink_timer = max(0.0, enter_hyperlink_timer - delta)
		if enter_hyperlink_timer <= 0.0:
			enter_hyperlink_timer = 1.0
			var hyperlink: Hyperlink = standing_on
			if position.x > hyperlink.position.x && position.x < hyperlink.position.x + hyperlink.size.x:
				if position.y > hyperlink.position.y - 16.0 && position.y < hyperlink.position.y + hyperlink.size.y:
					enter_hyperlink_audio.play()
					emit_signal("enter_hyperlink", hyperlink)
	
	# PASS THROUGH PLATFORM
	
	if standing_on != null && is_instance_valid(standing_on) && !standing_on is Hyperlink && actions.pass_platform:
		is_onground = false
		standing_on = null

func _unhandled_input(event):
	for action in actions.keys():
		if event.is_action_pressed(action):
			actions[action] = true
		if event.is_action_released(action):
			actions[action] = false
