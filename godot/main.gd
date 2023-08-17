extends Node

const Platform := preload("res://level/platform/platform.tscn")
const HyperlinkScene := preload("res://level/hyperlink/hyperlink.tscn")
const Hyperlink := preload("res://level/hyperlink/hyperlink.gd")
const FallingBody := preload("res://particle/falling_body/falling_body.tscn")

# The zoom scale for the whole game.
var scale = 2.0
var elements = {} # Map<int, Entity> # for mapping element ids to entities
var platforms_visible := false
var game: JavaScriptObject
var window: JavaScriptObject
var document: JavaScriptObject
var onscroll_callback: JavaScriptObject
var platform_inserted_callback: JavaScriptObject
var hyperlink_inserted_callback: JavaScriptObject
var for_each_text_callback: JavaScriptObject
var on_quit_request_callback: JavaScriptObject
onready var level := $Level
onready var player := $Level/Player

onready var lose_audio = $LoseAudio

func _ready():
	randomize()
	
	get_viewport().global_canvas_transform = get_viewport().global_canvas_transform.scaled(Vector2(scale, scale))
	
	# Mostly for debugging purposes
	if OS.get_name() != "HTML5":
		var platform := Platform.instance()
		platform.position.y = 256
		platform.size.x = 512
		level.add_child(platform)
	
	if OS.get_name() == "HTML5":
		# CALLBACKS
		game = JavaScript.get_interface("game")
		window = JavaScript.get_interface("window")
		document = JavaScript.get_interface("document")
		
		onscroll_callback = JavaScript.create_callback(self, "onscroll_callback")
		game.set_onscroll_callback(onscroll_callback)
		
		hyperlink_inserted_callback = JavaScript.create_callback(self, "hyperlink_inserted_callback")
		game.set_hyperlink_inserted_callback(hyperlink_inserted_callback)
		
		platform_inserted_callback = JavaScript.create_callback(self, "platform_inserted_callback")
		game.set_platform_inserted_callback(platform_inserted_callback)
		
		for_each_text_callback = JavaScript.create_callback(self, "for_each_text_callback")
		game.for_each_text_callback = for_each_text_callback
		
		on_quit_request_callback = JavaScript.create_callback(self, "on_quit_request_callback")
		game.on_quit_request_callback = on_quit_request_callback
		
		# TRANSPARENT BACKGROUND
		
		VisualServer.set_default_clear_color(Color(0, 0, 0, 0))
		get_tree().get_root().set_transparent_background(true)
		OS.window_per_pixel_transparency_enabled = true
		
		# Centers player to page
		player.position.x = document.body.scrollWidth / scale / 2.0
		player.position.y = 0
		
		# Pause the tree for a little bit because everything can look kinda jittery when first loading
		get_tree().paused = true
		yield(get_tree().create_timer(0.5), "timeout")
		get_tree().paused = false

func _process(delta):
	if OS.get_name() == "HTML5":
		# It would technically be better to check previous position to current position:
		# `pre_player_position != player.position`
		if player.is_inside_tree() && player.velocity != Vector2.ZERO:
			game.scroll_center_to(player.position.x * scale, player.position.y * scale)
		
		# Teleports the player between the left and right bounds of the page
		var world_width = document.body.scrollWidth / scale
		if player.position.x < -8:
			player.position.x = world_width + 8
		if player.position.x > world_width + 8:
			player.position.x = -8
		
		# Updates all platforms
#		unchecked_elements = elements.duplicate()
#		game.for_each_text()
#		for unchecked in unchecked_elements.values():
#			unchecked.queue_free()
		
		# Handles player falling out of screen
		var world_height = document.body.scrollHeight / scale
		if player.is_inside_tree() && player.position.y > world_height + 16.0:
			player.kill()
			player.respawn_timer = 3.0
		
		# Respawns player
		if !player.is_inside_tree():
			player.respawn_timer = max(player.respawn_timer - delta, 0)
			if player.respawn_timer <= 0:
				player.position.x = document.body.scrollWidth / scale / 2.0
				player.position.y = 0
				player.respawn()
				level.add_child(player)

func on_quit_request_callback(_args):
	get_tree().quit()

func onscroll_callback(args):
	var x = args[0]
	var y = args[1]
	get_viewport().global_canvas_transform.origin = Vector2(-x, -y)

func platform_inserted_callback(args):
	var element_id: int = args[0]
	var x = args[1]
	var y = args[2]
	var w = args[3]
	var h = args[4]
	
	if y < 16:
		return; # Platforms can't be spawned too close to the top as to avoid hiding the player upon spawning

	if w / scale < 8:
		return; # Platform is too small
	
	var platform := Platform.instance()
	platform.position.x = x / scale
	platform.position.y = y / scale
	platform.size.x = w / scale
	platform.size.y = h / scale
	platform.visible = platforms_visible
	level.add_child(platform)
	
	elements[element_id] = platform

func hyperlink_inserted_callback(args):
	var element_id: int = args[0]
	var x = args[1]
	var y = args[2]
	var w = args[3]
	var h = args[4]
	var link = args[5]
	
	if y < 16:
		return; # Platforms can't be spawned too close to the top as to avoid hiding the player upon spawning
	
	if w / scale < 8:
		return; # Platform is too small
	
	var hyperlink := HyperlinkScene.instance()
	hyperlink.position.x = x / scale
	hyperlink.position.y = y / scale
	hyperlink.size.x = w / scale
	hyperlink.size.y = h / scale
	hyperlink.link = link
	hyperlink.visible = platforms_visible
	level.add_child(hyperlink)
	
	elements[element_id] = hyperlink

func for_each_text_callback(args):
	var element_id = args[0]
	var x = args[1]
	var y = args[2]
	var w = args[3]
	var h = args[4]
	
	if elements.has(element_id):
#		unchecked_elements.erase(element_id)
		var platform = elements[element_id]
		platform.position.x = x / scale
		platform.position.y = y / scale
		platform.size.x = w / scale
		platform.size.y = h / scale
#	else:
#		platform_inserted_callback(args)

func _input(event: InputEvent):
	if event.is_action_pressed("toggle_platform_visibility"):
		platforms_visible = !platforms_visible
		var platforms = get_tree().get_nodes_in_group("platform")
		for platform in platforms:
			platform.visible = platforms_visible

func _on_Player_enter_hyperlink(hyperlink: Hyperlink):
	if OS.get_name() == "HTML5":
		game.enter_level(hyperlink.link)

func _on_Player_died():
	level.remove_child(player)
	lose_audio.play()
	
	var body := FallingBody.instance()
	body.position = player.position
	body.velocity.y = -player.JUMP_IMPULSE
	level.add_child(body)
