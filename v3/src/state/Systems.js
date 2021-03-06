/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2016 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

var EventDispatcher = require('../events/EventDispatcher');
var GameObjectFactory = require('./systems/GameObjectFactory');
var GameObjectCreator = require('./systems/GameObjectCreator');
var StateManager = require('./systems/StateManager');
var Loader = require('./systems/Loader');
var UpdateManager = require('./systems/UpdateManager');
var Component = require('../components');
var Settings = require('./Settings');
var RTree = require('../structs/RTree');
var Camera = require('../camera/Camera-2')

var Systems = function (state, config)
{
    this.state = state;

    this.game = null;

    this.config = config;

    this.settings = Settings.create(config);

    this.x = this.settings.x;
    this.y = this.settings.y;
    this.width = this.settings.width;
    this.height = this.settings.height;

    this.mask = null;
    this.canvas;
    this.context;

    //  CORE SYSTEMS / PROPERTIES

    this.cache;
    this.textures;

    //  Reference to State specific managers (Factory, Tweens, Loader, Physics, etc)
    this.add;
    this.make;
    this.load;
    this.events;
    this.updates;
    this.tree;
    this.stateManager;

    //  State properties
    this.cameras;
    this.children;
    this.color;
    this.data;
    this.fbo;
    this.time;
    this.transform;
};

Systems.prototype.constructor = Systems;

Systems.prototype = {

    init: function (game)
    {
        // console.log('State.Systems.init');

        this.game = game;

        Settings.init(this.settings, this.game.config);

        this.cache = this.game.cache;
        this.textures = this.game.textures;

        //  State specific managers (Factory, Tweens, Loader, Physics, etc)

        this.tree = RTree(16);
        this.events = new EventDispatcher();
        this.add = new GameObjectFactory(this.state);
        this.make = new GameObjectCreator(this.state);
        this.updates = new UpdateManager(this.state);
        this.load = new Loader(this.state);
        this.stateManager = new StateManager(this.state, game);

        //  State specific properties (transform, data, children, etc)

        this.children = new Component.Children(this.state);
        this.color = new Component.Color(this.state);
        this.data = new Component.Data(this.state);
        this.transform = new Component.Transform(this.state);

        this.cameras = [];
        this.mainCamera = new Camera(0, 0, this.game.config.width, this.game.config.height);
        this.cameras.push(this.mainCamera);
        this.inject();
    },

    inject: function ()
    {
        //  Defaults properties injected into the State

        this.state.game = this.game;

        this.state.events = this.events;
        this.state.add = this.add;
        this.state.load = this.load;
        this.state.children = this.children;
        this.state.color = this.color;
        this.state.data = this.data;
        this.state.settings = this.settings;
        this.state.state = this.stateManager;

        // this.state.camera = this.camera;
        this.state.transform = this.transform;

        this.state.cache = this.game.cache;
        this.state.textures = this.game.textures;

        for (var i = 0, l = this.cameras.length; i < l; ++i)
        {
            this.cameras[i].setState(this.state);
        }
    },

    //  Called just once per frame, regardless of speed
    begin: function (timestamp, frameDelta)
    {
    },

    //  Potentially called multiple times per frame (on super-fast systems)
    update: function (timestep, physicsStep)
    {
        for (var c = 0; c < this.children.list.length; c++)
        {
            var child = this.children.list[c];

            // if (child.exists)
            // {
                child.update(timestep);
            // }
        }

        this.state.update.call(this.state, timestep, physicsStep);
    },

    render: function (interpolation, renderer)
    {
        if (!this.settings.visible)
        {
            return;
        }

        var state = this.state;
        var transform = this.transform;
        var cameras = this.cameras;

        for (var i = 0, l = cameras.length; i < l; ++i)
        {
            var camera = cameras[i];

            camera.preRender();

            state.camera = camera;

            renderer.render(state, transform.flatRenderArray, interpolation, camera);

            camera.postRender();
        }
    },

    addCamera: function (x, y, width, height)
    {
        var camera = new Camera(x, y, width, height);
        camera.setState(this.state);
        this.cameras.push(camera);
        return camera;
    },

    resetCameras: function ()
    {
        this.cameras.length = 1;
        this.mainCamera = this.cameras[0];
        this.mainCamera.x = 0;
        this.mainCamera.y = 0;
        this.mainCamera.width = this.game.config.width;
        this.mainCamera.height = this.game.config.height;
    }

};

module.exports = Systems;
