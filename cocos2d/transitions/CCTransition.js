/****************************************************************************
 Copyright (c) 2008-2010 Ricardo Quesada
 Copyright (c) 2011-2012 cocos2d-x.org
 Copyright (c) 2013-2014 Chukong Technologies Inc.

 http://www.cocos2d-x.org

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/
/**
 * A tag constant for identifying fade scenes
 * @constant
 * @type Number
 */
cc.SCENE_FADE = 4208917214;

/**
 * horizontal orientation Type where the Left is nearer
 * @constant
 * @type Number
 */
cc.TRANSITION_ORIENTATION_LEFT_OVER = 0;
/**
 * horizontal orientation type where the Right is nearer
 * @constant
 * @type Number
 */
cc.TRANSITION_ORIENTATION_RIGHT_OVER = 1;
/**
 * vertical orientation type where the Up is nearer
 * @constant
 * @type Number
 */
cc.TRANSITION_ORIENTATION_UP_OVER = 0;
/**
 * vertical orientation type where the Bottom is nearer
 * @constant
 * @type Number
 */
cc.TRANSITION_ORIENTATION_DOWN_OVER = 1;

/**
 * @class
 * @extends cc.Scene
 */
cc.TransitionScene = cc.Scene.extend(/** @lends cc.TransitionScene# */{
    _inScene:null,
    _outScene:null,
    _duration:null,
    _isInSceneOnTop:false,
    _isSendCleanupToScene:false,
    _className:"TransitionScene",

    /**
     * creates a base transition with duration and incoming scene
     * Constructor of cc.TransitionScene
     * @function
     * @param {Number} t time in seconds
     * @param {cc.Scene} scene the scene to transit with
     */
    ctor:function (t, scene) {
        cc.Scene.prototype.ctor.call(this);
        if(t !== undefined && scene !== undefined)
            this.initWithDuration(t, scene);
    },

    //private
    _setNewScene:function (dt) {
        this.unschedule(this._setNewScene);
        // Before replacing, save the "send cleanup to scene"
        var director = cc.director;
        this._isSendCleanupToScene = director.isSendCleanupToScene();
        director.runScene(this._inScene);

        // enable events while transitions
        cc.eventManager.setEnabled(true);

        // issue #267
        this._outScene.visible = true;
    },

    //protected
    _sceneOrder:function () {
        this._isInSceneOnTop = true;
    },

    /**
     * stuff gets drawn here
     */
    draw:function () {
        if (this._isInSceneOnTop) {
            this._outScene.visit();
            this._inScene.visit();
        } else {
            this._inScene.visit();
            this._outScene.visit();
        }
    },

    /**
     * custom onEnter
     */
    onEnter:function () {
        cc.Node.prototype.onEnter.call(this);

        // disable events while transitions
        cc.eventManager.setEnabled(false);

        // outScene should not receive the onEnter callback
        // only the onExitTransitionDidStart
        this._outScene.onExitTransitionDidStart();

        this._inScene.onEnter();
    },

    /**
     * custom onExit
     */
    onExit:function () {
        cc.Node.prototype.onExit.call(this);

        // enable events while transitions
        cc.eventManager.setEnabled(true);

        this._outScene.onExit();

        // _inScene should not receive the onEnter callback
        // only the onEnterTransitionDidFinish
        this._inScene.onEnterTransitionDidFinish();
    },

    /**
     * custom cleanup
     */
    cleanup:function () {
        cc.Node.prototype.cleanup.call(this);

        if (this._isSendCleanupToScene)
            this._outScene.cleanup();
    },

    /**
     * initializes a transition with duration and incoming scene
     * @param {Number} t time in seconds
     * @param {cc.Scene} scene a scene to transit to
     * @return {Boolean} return false if error
     */
    initWithDuration:function (t, scene) {
        if(!scene)
            throw "cc.TransitionScene.initWithDuration(): Argument scene must be non-nil";

        if (this.init()) {
            this._duration = t;
            this.attr({
	            x: 0,
	            y: 0,
	            anchorX: 0,
	            anchorY: 0
            });
            // retain
            this._inScene = scene;
            this._outScene = cc.director.getRunningScene();
            if (!this._outScene) {
                this._outScene = cc.Scene.create();
                this._outScene.init();
            }

            if(this._inScene == this._outScene)
                throw "cc.TransitionScene.initWithDuration(): Incoming scene must be different from the outgoing scene";

            this._sceneOrder();
            return true;
        } else {
            return false;
        }
    },

    /**
     * called after the transition finishes
     */
    finish:function () {
        // clean up
        this._inScene.attr({
			visible: true,
	        x: 0,
	        y: 0,
	        scale: 1.0,
	        rotation: 0.0
        });
        if(cc._renderType === cc._RENDER_TYPE_WEBGL)
            this._inScene.getCamera().restore();

        this._outScene.attr({
	        visible: false,
	        x: 0,
	        y: 0,
	        scale: 1.0,
	        rotation: 0.0
        });
        if(cc._renderType === cc._RENDER_TYPE_WEBGL)
            this._outScene.getCamera().restore();

        //[self schedule:@selector(setNewScene:) interval:0];
        this.schedule(this._setNewScene, 0);
    },

    /**
     * set hide the out scene and show in scene
     */
    hideOutShowIn:function () {
        this._inScene.visible = true;
        this._outScene.visible = false;
    }
});
/**
 * creates a base transition with duration and incoming scene
 * @deprecated
 * @param {Number} t time in seconds
 * @param {cc.Scene} scene the scene to transit with
 * @return {cc.TransitionScene|Null}
 */
cc.TransitionScene.create = function (t, scene) {
    return new cc.TransitionScene(t, scene);
};

/**
 * A cc.Transition that supports orientation like.<br/>
 * Possible orientation: LeftOver, RightOver, UpOver, DownOver<br/>
 * useful for when you want to make a transition happen between 2 orientations
 * @class
 * @extends cc.TransitionScene
 */
cc.TransitionSceneOriented = cc.TransitionScene.extend(/** @lends cc.TransitionSceneOriented# */{
    _orientation:0,

    /**
     * Constructor of TransitionSceneOriented
     * @function
     * @param {Number} t time in seconds
     * @param {cc.Scene} scene
     * @param {cc.TRANSITION_ORIENTATION_LEFT_OVER|cc.TRANSITION_ORIENTATION_RIGHT_OVER|cc.TRANSITION_ORIENTATION_UP_OVER|cc.TRANSITION_ORIENTATION_DOWN_OVER} orientation
     */
    ctor:function (t, scene, orientation) {
        cc.TransitionScene.prototype.ctor.call(this);
        orientation != undefined && this.initWithDuration(t, scene, orientation);
    },
    /**
     * initialize the transition
     * @param {Number} t time in seconds
     * @param {cc.Scene} scene
     * @param {cc.TRANSITION_ORIENTATION_LEFT_OVER|cc.TRANSITION_ORIENTATION_RIGHT_OVER|cc.TRANSITION_ORIENTATION_UP_OVER|cc.TRANSITION_ORIENTATION_DOWN_OVER} orientation
     * @return {Boolean}
     */
    initWithDuration:function (t, scene, orientation) {
        if (cc.TransitionScene.prototype.initWithDuration.call(this, t, scene)) {
            this._orientation = orientation;
        }
        return true;
    }
});

/**
 * creates a base transition with duration and incoming scene
 * @deprecated
 * @param {Number} t time in seconds
 * @param {cc.Scene} scene
 * @param {cc.TRANSITION_ORIENTATION_LEFT_OVER|cc.TRANSITION_ORIENTATION_RIGHT_OVER|cc.TRANSITION_ORIENTATION_UP_OVER|cc.TRANSITION_ORIENTATION_DOWN_OVER} orientation
 * @return {cc.TransitionSceneOriented}
 * @example
 * // Example
 * var goHorizontal = cc.TransitionSceneOriented.create(0.5, thisScene, cc.TRANSITION_ORIENTATION_LEFT_OVER)
 */
cc.TransitionSceneOriented.create = function (t, scene, orientation) {
    return new cc.TransitionSceneOriented(t, scene, orientation);
};

/**
 *  Rotate and zoom out the outgoing scene, and then rotate and zoom in the incoming
 * @class
 * @extends cc.TransitionScene
 */
cc.TransitionRotoZoom = cc.TransitionScene.extend(/** @lends cc.TransitionRotoZoom# */{

    /**
     * Constructor of TransitionRotoZoom
     * @function
     * @param {Number} t time in seconds
     * @param {cc.Scene} scene
     */
    ctor:function (t, scene) {
        cc.TransitionScene.prototype.ctor.call(this);
        scene && this.initWithDuration(t, scene);
    },
    /**
     * Custom On Enter callback
     * @override
     */
    onEnter:function () {
        cc.TransitionScene.prototype.onEnter.call(this);

	    this._inScene.attr({
		    scale: 0.001,
		    anchorX: 0.5,
		    anchorY: 0.5
	    });
	    this._outScene.attr({
		    scale: 1.0,
		    anchorX: 0.5,
		    anchorY: 0.5
	    });
	    
        var rotoZoom = cc.Sequence.create(
            cc.Spawn.create(cc.ScaleBy.create(this._duration / 2, 0.001),
                cc.RotateBy.create(this._duration / 2, 360 * 2)),
            cc.DelayTime.create(this._duration / 2));

        this._outScene.runAction(rotoZoom);
        this._inScene.runAction(
            cc.Sequence.create(rotoZoom.reverse(),
                cc.CallFunc.create(this.finish, this)));
    }
});

/**
 * Creates a Transtion rotation and zoom
 * @deprecated
 * @param {Number} t time in seconds
 * @param {cc.Scene} scene the scene to work with
 * @return {cc.TransitionRotoZoom}
 * @example
 * // Example
 * var RotoZoomTrans = cc.TransitionRotoZoom.create(2, nextScene);
 */
cc.TransitionRotoZoom.create = function (t, scene) {
    return new cc.TransitionRotoZoom(t, scene);
};

/**
 * Zoom out and jump the outgoing scene, and then jump and zoom in the incoming
 * @class
 * @extends cc.TransitionScene
 */
cc.TransitionJumpZoom = cc.TransitionScene.extend(/** @lends cc.TransitionJumpZoom# */{
    /**
     * Constructor of TransitionJumpZoom
     * @function
     * @param {Number} t time in seconds
     * @param {cc.Scene} scene
     */
    ctor:function (t, scene) {
        cc.TransitionScene.prototype.ctor.call(this);
        scene && this.initWithDuration(t, scene);
    },
    /**
     * Custom on enter
     */
    onEnter:function () {
        cc.TransitionScene.prototype.onEnter.call(this);
        var winSize = cc.director.getWinSize();

	    this._inScene.attr({
		    scale: 0.5,
		    x: winSize.width,
		    y: 0,
		    anchorX: 0.5,
		    anchorY: 0.5
	    });
        this._outScene.anchorX = 0.5;
	    this._outScene.anchorY = 0.5;

        var jump = cc.JumpBy.create(this._duration / 4, cc.p(-winSize.width, 0), winSize.width / 4, 2);
        var scaleIn = cc.ScaleTo.create(this._duration / 4, 1.0);
        var scaleOut = cc.ScaleTo.create(this._duration / 4, 0.5);

        var jumpZoomOut = cc.Sequence.create(scaleOut, jump);
        var jumpZoomIn = cc.Sequence.create(jump, scaleIn);

        var delay = cc.DelayTime.create(this._duration / 2);
        this._outScene.runAction(jumpZoomOut);
        this._inScene.runAction(cc.Sequence.create(delay, jumpZoomIn, cc.CallFunc.create(this.finish, this)));
    }
});

/**
 * creates a scene transition that zooms then jump across the screen, the same for the incoming scene
 * @deprecated
 * @param {Number} t time in seconds
 * @param {cc.Scene} scene
 * @return {cc.TransitionJumpZoom}
 */
cc.TransitionJumpZoom.create = function (t, scene) {
    return new cc.TransitionJumpZoom(t, scene);
};

/**
 * Move in from to the left the incoming scene.
 * @class
 * @extends cc.TransitionScene
 */
cc.TransitionMoveInL = cc.TransitionScene.extend(/** @lends cc.TransitionMoveInL# */{
    /**
     * Constructor of TransitionMoveInL
     * @function
     * @param {Number} t time in seconds
     * @param {cc.Scene} scene
     */
    ctor:function (t, scene) {
        cc.TransitionScene.prototype.ctor.call(this);
        scene && this.initWithDuration(t, scene);
    },
    /**
     * Custom on enter
     */
    onEnter:function () {
        cc.TransitionScene.prototype.onEnter.call(this);
        this.initScenes();

        var action = this.action();
        this._inScene.runAction(
            cc.Sequence.create(this.easeActionWithAction(action), cc.CallFunc.create(this.finish, this))
        );
    },

    /**
     * initializes the scenes
     */
    initScenes:function () {
        this._inScene.setPosition(-cc.director.getWinSize().width, 0);
    },

    /**
     * returns the action that will be performed
     */
    action:function () {
        return cc.MoveTo.create(this._duration, cc.p(0, 0));
    },

    /**
     * creates an ease action from action
     * @param {cc.ActionInterval} action
     * @return {cc.EaseOut}
     */
    easeActionWithAction:function (action) {
        return cc.EaseOut.create(action, 2.0);
    }
});

/**
 * creates an action that  Move in from to the left the incoming scene.
 * @deprecated
 * @param {Number} t time in seconds
 * @param {cc.Scene} scene
 * @return {cc.TransitionMoveInL}
 * @example
 * // Example
 * var MoveInLeft = cc.TransitionMoveInL.create(1, nextScene)
 */
cc.TransitionMoveInL.create = function (t, scene) {
    return new cc.TransitionMoveInL(t, scene);
};

/**
 * Move in from to the right the incoming scene.
 * @class
 * @extends cc.TransitionMoveInL
 */
cc.TransitionMoveInR = cc.TransitionMoveInL.extend(/** @lends cc.TransitionMoveInR# */{
    /**
     * Constructor of TransitionMoveInR
     * @function
     * @param {Number} t time in seconds
     * @param {cc.Scene} scene
     */
    ctor:function (t, scene) {
        cc.TransitionMoveInL.prototype.ctor.call(this);
        scene && this.initWithDuration(t, scene);
    },
    /**
     * Init
     */
    initScenes:function () {
        this._inScene.setPosition(cc.director.getWinSize().width, 0);
    }
});

/**
 * create a scene transition that Move in from to the right the incoming scene.
 * @deprecated
 * @param {Number} t time in seconds
 * @param {cc.Scene} scene
 * @return {cc.TransitionMoveInR}
 * @example
 * // Example
 * var MoveInRight = cc.TransitionMoveInR.create(1, nextScene)
 */
cc.TransitionMoveInR.create = function (t, scene) {
    return new cc.TransitionMoveInR(t, scene);
};

/**
 * Move in from to the top the incoming scene.
 * @class
 * @extends cc.TransitionMoveInL
 */
cc.TransitionMoveInT = cc.TransitionMoveInL.extend(/** @lends cc.TransitionMoveInT# */{
    /**
     * Constructor of TransitionMoveInT
     * @function
     * @param {Number} t time in seconds
     * @param {cc.Scene} scene
     */
    ctor:function (t, scene) {
        cc.TransitionMoveInL.prototype.ctor.call(this);
        scene && this.initWithDuration(t, scene);
    },
    /**
     * init
     */
    initScenes:function () {
        this._inScene.setPosition(0, cc.director.getWinSize().height);
    }
});

/**
 * Move in from to the top the incoming scene.
 * @deprecated
 * @param {Number} t time in seconds
 * @param {cc.Scene} scene
 * @return {cc.TransitionMoveInT}
 * @example
 * // Example
 * var MoveInTop = cc.TransitionMoveInT.create(1, nextScene)
 */
cc.TransitionMoveInT.create = function (t, scene) {
    return new cc.TransitionMoveInT(t, scene);
};

/**
 *  Move in from to the bottom the incoming scene.
 * @class
 * @extends cc.TransitionMoveInL
 */
cc.TransitionMoveInB = cc.TransitionMoveInL.extend(/** @lends cc.TransitionMoveInB# */{
    /**
     * Constructor of TransitionMoveInB
     * @function
     * @param {Number} t time in seconds
     * @param {cc.Scene} scene
     */
    ctor:function (t, scene) {
        cc.TransitionMoveInL.prototype.ctor.call(this);
        scene && this.initWithDuration(t, scene);
    },

    /**
     * init
     */
    initScenes:function () {
        this._inScene.setPosition(0, -cc.director.getWinSize().height);
    }
});

/**
 * create a scene transition that Move in from to the bottom the incoming scene.
 * @deprecated
 * @param {Number} t time in seconds
 * @param {cc.Scene} scene
 * @return {cc.TransitionMoveInB}
 * @example
 * // Example
 * var MoveinB = cc.TransitionMoveInB.create(1, nextScene)
 */
cc.TransitionMoveInB.create = function (t, scene) {
    return new cc.TransitionMoveInB(t, scene);
};

/**
 * The adjust factor is needed to prevent issue #442<br/>
 * One solution is to use DONT_RENDER_IN_SUBPIXELS images, but NO<br/>
 * The other issue is that in some transitions (and I don't know why)<br/>
 * the order should be reversed (In in top of Out or vice-versa).
 * @constant
 * @type Number
 */
cc.ADJUST_FACTOR = 0.5;

/**
 * a transition that a new scene is slided from left
 * @class
 * @extends cc.TransitionScene
 */
cc.TransitionSlideInL = cc.TransitionScene.extend(/** @lends cc.TransitionSlideInL# */{
    /**
     * Constructor of TransitionSlideInL
     * @function
     * @param {Number} t time in seconds
     * @param {cc.Scene} scene
     */
    ctor:function (t, scene) {
        cc.TransitionScene.prototype.ctor.call(this);
        scene && this.initWithDuration(t, scene);
    },
    _sceneOrder:function () {
        this._isInSceneOnTop = false;
    },

    /**
     * custom on enter
     */
    onEnter:function () {
        cc.TransitionScene.prototype.onEnter.call(this);
        this.initScenes();

        var inA = this.action();
        var outA = this.action();

        var inAction = this.easeActionWithAction(inA);
        var outAction = cc.Sequence.create(this.easeActionWithAction(outA), cc.CallFunc.create(this.finish, this));
        this._inScene.runAction(inAction);
        this._outScene.runAction(outAction);
    },

    /**
     * initializes the scenes
     */
    initScenes:function () {
        this._inScene.setPosition(-cc.director.getWinSize().width + cc.ADJUST_FACTOR, 0);
    },
    /**
     * returns the action that will be performed by the incomming and outgoing scene
     * @return {cc.MoveBy}
     */
    action:function () {
        return cc.MoveBy.create(this._duration, cc.p(cc.director.getWinSize().width - cc.ADJUST_FACTOR, 0));
    },

    /**
     * @param {cc.ActionInterval} action
     * @return {*}
     */
    easeActionWithAction:function (action) {
        return cc.EaseOut.create(action, 2.0);
    }
});

/**
 * create a transition that a new scene is slided from left
 * @deprecated
 * @param {Number} t time in seconds
 * @param {cc.Scene} scene
 * @return {cc.TransitionSlideInL}
 * @example
 * // Example
 * var myTransition = cc.TransitionSlideInL.create(1.5, nextScene)
 */
cc.TransitionSlideInL.create = function (t, scene) {
    return new cc.TransitionSlideInL(t, scene);
};

/**
 *  Slide in the incoming scene from the right border.
 * @class
 * @extends cc.TransitionSlideInL
 */
cc.TransitionSlideInR = cc.TransitionSlideInL.extend(/** @lends cc.TransitionSlideInR# */{
    /**
     * Constructor of TransitionSlideInR
     * @function
     * @param {Number} t time in seconds
     * @param {cc.Scene} scene
     */
    ctor:function (t, scene) {
        cc.TransitionSlideInL.prototype.ctor.call(this);
        scene && this.initWithDuration(t, scene);
    },
    _sceneOrder:function () {
        this._isInSceneOnTop = true;
    },
    /**
     * initializes the scenes
     */
    initScenes:function () {
        this._inScene.setPosition(cc.director.getWinSize().width - cc.ADJUST_FACTOR, 0);
    },
    /**
     *  returns the action that will be performed by the incomming and outgoing scene
     * @return {cc.MoveBy}
     */
    action:function () {
        return cc.MoveBy.create(this._duration, cc.p(-(cc.director.getWinSize().width - cc.ADJUST_FACTOR), 0));
    }
});

/**
 * create Slide in the incoming scene from the right border.
 * @deprecated
 * @param {Number} t time in seconds
 * @param {cc.Scene} scene
 * @return {cc.TransitionSlideInR}
 * @example
 * // Example
 * var myTransition = cc.TransitionSlideInR.create(1.5, nextScene)
 */
cc.TransitionSlideInR.create = function (t, scene) {
    return new cc.TransitionSlideInR(t, scene);
};

/**
 * Slide in the incoming scene from the bottom border.
 * @class
 * @extends cc.TransitionSlideInL
 */
cc.TransitionSlideInB = cc.TransitionSlideInL.extend(/** @lends cc.TransitionSlideInB# */{
    /**
     * Constructor of TransitionSlideInB
     * @function
     * @param {Number} t time in seconds
     * @param {cc.Scene} scene
     */
    ctor:function (t, scene) {
        cc.TransitionSlideInL.prototype.ctor.call(this);
        scene && this.initWithDuration(t, scene);
    },
    _sceneOrder:function () {
        this._isInSceneOnTop = false;
    },

    /**
     * initializes the scenes
     */
    initScenes:function () {
        this._inScene.setPosition(0, -(cc.director.getWinSize().height - cc.ADJUST_FACTOR));
    },

    /**
     * returns the action that will be performed by the incomming and outgoing scene
     * @return {cc.MoveBy}
     */
    action:function () {
        return cc.MoveBy.create(this._duration, cc.p(0, cc.director.getWinSize().height - cc.ADJUST_FACTOR));
    }
});

/**
 * create a Slide in the incoming scene from the bottom border.
 * @deprecated
 * @param {Number} t time in seconds
 * @param {cc.Scene} scene
 * @return {cc.TransitionSlideInB}
 * @example
 * // Example
 * var myTransition = cc.TransitionSlideInB.create(1.5, nextScene)
 */
cc.TransitionSlideInB.create = function (t, scene) {
    return new cc.TransitionSlideInB(t, scene);
};

/**
 *  Slide in the incoming scene from the top border.
 *  @class
 *  @extends cc.TransitionSlideInL
 */
cc.TransitionSlideInT = cc.TransitionSlideInL.extend(/** @lends cc.TransitionSlideInT# */{
    /**
     * Constructor of TransitionSlideInT
     * @function
     * @param {Number} t time in seconds
     * @param {cc.Scene} scene
     */
    ctor:function (t, scene) {
        cc.TransitionSlideInL.prototype.ctor.call(this);
        scene && this.initWithDuration(t, scene);
    },
    _sceneOrder:function () {
        this._isInSceneOnTop = true;
    },

    /**
     * initializes the scenes
     */
    initScenes:function () {
        this._inScene.setPosition(0, cc.director.getWinSize().height - cc.ADJUST_FACTOR);
    },

    /**
     * returns the action that will be performed by the incomming and outgoing scene
     * @return {cc.MoveBy}
     */
    action:function () {
        return cc.MoveBy.create(this._duration, cc.p(0, -(cc.director.getWinSize().height - cc.ADJUST_FACTOR)));
    }
});

/**
 * create a Slide in the incoming scene from the top border.
 * @deprecated
 * @param {Number} t time in seconds
 * @param {cc.Scene} scene
 * @return {cc.TransitionSlideInT}
 * @example
 * // Example
 * var myTransition = cc.TransitionSlideInT.create(1.5, nextScene)
 */
cc.TransitionSlideInT.create = function (t, scene) {
    return new cc.TransitionSlideInT(t, scene);
};

/**
 * Shrink the outgoing scene while grow the incoming scene
 * @class
 * @extends cc.TransitionScene
 */
cc.TransitionShrinkGrow = cc.TransitionScene.extend(/** @lends cc.TransitionShrinkGrow# */{
    /**
     * Constructor of TransitionShrinkGrow
     * @function
     * @param {Number} t time in seconds
     * @param {cc.Scene} scene
     */
    ctor:function (t, scene) {
        cc.TransitionScene.prototype.ctor.call(this);
        scene && this.initWithDuration(t, scene);
    },
    /**
     * Custom on enter
     */
    onEnter:function () {
        cc.TransitionScene.prototype.onEnter.call(this);

	    this._inScene.attr({
		    scale: 0.001,
		    anchorX: 2 / 3.0,
		    anchorY: 0.5
	    });
	    this._outScene.attr({
		    scale: 1.0,
		    anchorX: 1 / 3.0,
		    anchorY: 0.5
	    });

        var scaleOut = cc.ScaleTo.create(this._duration, 0.01);
        var scaleIn = cc.ScaleTo.create(this._duration, 1.0);

        this._inScene.runAction(this.easeActionWithAction(scaleIn));
        this._outScene.runAction(
            cc.Sequence.create(this.easeActionWithAction(scaleOut), cc.CallFunc.create(this.finish, this))
        );
    },

    /**
     * @param action
     * @return {cc.EaseOut}
     */
    easeActionWithAction:function (action) {
        return cc.EaseOut.create(action, 2.0);
    }
});

/**
 * Shrink the outgoing scene while grow the incoming scene
 * @deprecated
 * @param {Number} t time in seconds
 * @param {cc.Scene} scene
 * @return {cc.TransitionShrinkGrow}
 * @example
 * // Example
 * var myTransition = cc.TransitionShrinkGrow.create(1.5, nextScene)
 */
cc.TransitionShrinkGrow.create = function (t, scene) {
    return new cc.TransitionShrinkGrow(t, scene);
};

/**
 *  Flips the screen horizontally.<br/>
 * The front face is the outgoing scene and the back face is the incoming scene.
 * @class
 * @extends cc.TransitionSceneOriented
 */
cc.TransitionFlipX = cc.TransitionSceneOriented.extend(/** @lends cc.TransitionFlipX# */{
    /**
     * Constructor of TransitionFlipX
     * @function
     * @param {Number} t time in seconds
     * @param {cc.Scene} scene
     * @param {cc.TRANSITION_ORIENTATION_LEFT_OVER|cc.TRANSITION_ORIENTATION_RIGHT_OVER|cc.TRANSITION_ORIENTATION_UP_OVER|cc.TRANSITION_ORIENTATION_DOWN_OVER} o
     */
    ctor:function (t, scene, o) {
        cc.TransitionSceneOriented.prototype.ctor.call(this);
        o = o || cc.TRANSITION_ORIENTATION_RIGHT_OVER;
        scene && this.initWithDuration(t, scene, o);
    },

    /**
     * custom on enter
     */
    onEnter:function () {
        cc.TransitionScene.prototype.onEnter.call(this);

        var inA, outA;
        this._inScene.visible = false;

        var inDeltaZ, inAngleZ, outDeltaZ, outAngleZ;

        if (this._orientation === cc.TRANSITION_ORIENTATION_RIGHT_OVER) {
            inDeltaZ = 90;
            inAngleZ = 270;
            outDeltaZ = 90;
            outAngleZ = 0;
        } else {
            inDeltaZ = -90;
            inAngleZ = 90;
            outDeltaZ = -90;
            outAngleZ = 0;
        }

        inA = cc.Sequence.create(
            cc.DelayTime.create(this._duration / 2), cc.Show.create(),
            cc.OrbitCamera.create(this._duration / 2, 1, 0, inAngleZ, inDeltaZ, 0, 0),
            cc.CallFunc.create(this.finish, this)
        );

        outA = cc.Sequence.create(
            cc.OrbitCamera.create(this._duration / 2, 1, 0, outAngleZ, outDeltaZ, 0, 0),
            cc.Hide.create(), cc.DelayTime.create(this._duration / 2)
        );

        this._inScene.runAction(inA);
        this._outScene.runAction(outA);
    }
});

/**
 * Flips the screen horizontally.<br/>
 * The front face is the outgoing scene and the back face is the incoming scene.
 * @deprecated
 * @param {Number} t time in seconds
 * @param {cc.Scene} scene
 * @param {cc.TRANSITION_ORIENTATION_LEFT_OVER|cc.TRANSITION_ORIENTATION_RIGHT_OVER|cc.TRANSITION_ORIENTATION_UP_OVER|cc.TRANSITION_ORIENTATION_DOWN_OVER} o
 * @return {cc.TransitionFlipX}
 * @example
 * // Example
 * var myTransition = cc.TransitionFlipX.create(1.5, nextScene) //default is cc.TRANSITION_ORIENTATION_RIGHT_OVER
 *
 * //OR
 * var myTransition = cc.TransitionFlipX.create(1.5, nextScene, cc.TRANSITION_ORIENTATION_UP_OVER)
 */
cc.TransitionFlipX.create = function (t, scene, o) {
    return new cc.TransitionFlipX(t, scene, o);
};

/**
 * Flips the screen vertically.<br/>
 * The front face is the outgoing scene and the back face is the incoming scene.
 * @class
 * @extends cc.TransitionSceneOriented
 */
cc.TransitionFlipY = cc.TransitionSceneOriented.extend(/** @lends cc.TransitionFlipY# */{

    /**
     * Constructor of TransitionFlipY
     * @function
     * @param {Number} t time in seconds
     * @param {cc.Scene} scene
     * @param {cc.TRANSITION_ORIENTATION_LEFT_OVER|cc.TRANSITION_ORIENTATION_RIGHT_OVER|cc.TRANSITION_ORIENTATION_UP_OVER|cc.TRANSITION_ORIENTATION_DOWN_OVER} o
     */
    ctor:function (t, scene, o) {
        cc.TransitionSceneOriented.prototype.ctor.call(this);
        o = o || cc.TRANSITION_ORIENTATION_UP_OVER;
        scene && this.initWithDuration(t, scene, o);
    },
    /**
     * custom on enter
     */
    onEnter:function () {
        cc.TransitionScene.prototype.onEnter.call(this);

        var inA, outA;
        this._inScene.visible = false;

        var inDeltaZ, inAngleZ, outDeltaZ, outAngleZ;

        if (this._orientation == cc.TRANSITION_ORIENTATION_UP_OVER) {
            inDeltaZ = 90;
            inAngleZ = 270;
            outDeltaZ = 90;
            outAngleZ = 0;
        } else {
            inDeltaZ = -90;
            inAngleZ = 90;
            outDeltaZ = -90;
            outAngleZ = 0;
        }

        inA = cc.Sequence.create(
            cc.DelayTime.create(this._duration / 2), cc.Show.create(),
            cc.OrbitCamera.create(this._duration / 2, 1, 0, inAngleZ, inDeltaZ, 90, 0),
            cc.CallFunc.create(this.finish, this)
        );
        outA = cc.Sequence.create(
            cc.OrbitCamera.create(this._duration / 2, 1, 0, outAngleZ, outDeltaZ, 90, 0),
            cc.Hide.create(), cc.DelayTime.create(this._duration / 2)
        );

        this._inScene.runAction(inA);
        this._outScene.runAction(outA);
    }
});

/**
 * Flips the screen vertically.<br/>
 * The front face is the outgoing scene and the back face is the incoming scene.
 * @deprecated
 * @param {Number} t time in seconds
 * @param {cc.Scene} scene
 * @param {cc.TRANSITION_ORIENTATION_LEFT_OVER|cc.TRANSITION_ORIENTATION_RIGHT_OVER|cc.TRANSITION_ORIENTATION_UP_OVER|cc.TRANSITION_ORIENTATION_DOWN_OVER} o
 * @return {cc.TransitionFlipY}
 * @example
 * // Example
 * var myTransition = cc.TransitionFlipY.create(1.5, nextScene)//default is cc.TRANSITION_ORIENTATION_UP_OVER
 *
 * //OR
 * var myTransition = cc.TransitionFlipY.create(1.5, nextScene, cc.TRANSITION_ORIENTATION_RIGHT_OVER)
 */
cc.TransitionFlipY.create = function (t, scene, o) {
    return new cc.TransitionFlipY(t, scene, o);
};

/**
 * Flips the screen half horizontally and half vertically.<br/>
 * The front face is the outgoing scene and the back face is the incoming scene.
 * @class
 * @extends cc.TransitionSceneOriented
 */
cc.TransitionFlipAngular = cc.TransitionSceneOriented.extend(/** @lends cc.TransitionFlipAngular# */{
    /**
     * Constructor of TransitionFlipAngular
     * @function
     * @param {Number} t time in seconds
     * @param {cc.Scene} scene
     * @param {cc.TRANSITION_ORIENTATION_LEFT_OVER|cc.TRANSITION_ORIENTATION_RIGHT_OVER|cc.TRANSITION_ORIENTATION_UP_OVER|cc.TRANSITION_ORIENTATION_DOWN_OVER} o
     */
    ctor:function (t, scene, o) {
        cc.TransitionSceneOriented.prototype.ctor.call(this);
        o = o || cc.TRANSITION_ORIENTATION_RIGHT_OVER;
        scene && this.initWithDuration(t, scene, o);
    },
    /**
     * custom on enter
     */
    onEnter:function () {
        cc.TransitionScene.prototype.onEnter.call(this);

        var inA, outA;
        this._inScene.visible = false;

        var inDeltaZ, inAngleZ, outDeltaZ, outAngleZ;

        if (this._orientation === cc.TRANSITION_ORIENTATION_RIGHT_OVER) {
            inDeltaZ = 90;
            inAngleZ = 270;
            outDeltaZ = 90;
            outAngleZ = 0;
        } else {
            inDeltaZ = -90;
            inAngleZ = 90;
            outDeltaZ = -90;
            outAngleZ = 0;
        }

        inA = cc.Sequence.create(
            cc.DelayTime.create(this._duration / 2), cc.Show.create(),
            cc.OrbitCamera.create(this._duration / 2, 1, 0, inAngleZ, inDeltaZ, -45, 0),
            cc.CallFunc.create(this.finish, this)
        );
        outA = cc.Sequence.create(
            cc.OrbitCamera.create(this._duration / 2, 1, 0, outAngleZ, outDeltaZ, 45, 0),
            cc.Hide.create(), cc.DelayTime.create(this._duration / 2)
        );

        this._inScene.runAction(inA);
        this._outScene.runAction(outA);
    }
});

/**
 * Flips the screen half horizontally and half vertically.<br/>
 * The front face is the outgoing scene and the back face is the incoming scene.
 * @deprecated
 * @param {Number} t time in seconds
 * @param {cc.Scene} scene
 * @param {cc.TRANSITION_ORIENTATION_LEFT_OVER|cc.TRANSITION_ORIENTATION_RIGHT_OVER|cc.TRANSITION_ORIENTATION_UP_OVER|cc.TRANSITION_ORIENTATION_DOWN_OVER} o
 * @return {cc.TransitionFlipAngular}
 * @example
 * // Example
 * var myTransition = cc.TransitionFlipAngular.create(1.5, nextScene)//default is cc.TRANSITION_ORIENTATION_RIGHT_OVER
 *
 * //or
 * var myTransition = cc.TransitionFlipAngular.create(1.5, nextScene, cc.TRANSITION_ORIENTATION_DOWN_OVER)
 */
cc.TransitionFlipAngular.create = function (t, scene, o) {
    return new cc.TransitionFlipAngular(t, scene, o);
};

/**
 *  Flips the screen horizontally doing a zoom out/in<br/>
 * The front face is the outgoing scene and the back face is the incoming scene.
 * @class
 * @extends cc.TransitionSceneOriented
 */
cc.TransitionZoomFlipX = cc.TransitionSceneOriented.extend(/** @lends cc.TransitionZoomFlipX# */{

    /**
     * Constructor of TransitionZoomFlipX
     * @function
     * @param {Number} t time in seconds
     * @param {cc.Scene} scene
     * @param {cc.TRANSITION_ORIENTATION_LEFT_OVER|cc.TRANSITION_ORIENTATION_RIGHT_OVER|cc.TRANSITION_ORIENTATION_UP_OVER|cc.TRANSITION_ORIENTATION_DOWN_OVER} o
     */
    ctor:function (t, scene, o) {
        cc.TransitionSceneOriented.prototype.ctor.call(this);
        o = o || cc.TRANSITION_ORIENTATION_RIGHT_OVER;
        scene && this.initWithDuration(t, scene, o);
    },
    /**
     * custom on enter
     */
    onEnter:function () {
        cc.TransitionScene.prototype.onEnter.call(this);

        var inA, outA;
        this._inScene.visible = false;

        var inDeltaZ, inAngleZ, outDeltaZ, outAngleZ;

        if (this._orientation === cc.TRANSITION_ORIENTATION_RIGHT_OVER) {
            inDeltaZ = 90;
            inAngleZ = 270;
            outDeltaZ = 90;
            outAngleZ = 0;
        } else {
            inDeltaZ = -90;
            inAngleZ = 90;
            outDeltaZ = -90;
            outAngleZ = 0;
        }

        inA = cc.Sequence.create(
            cc.DelayTime.create(this._duration / 2),
            cc.Spawn.create(
                cc.OrbitCamera.create(this._duration / 2, 1, 0, inAngleZ, inDeltaZ, 0, 0),
                cc.ScaleTo.create(this._duration / 2, 1), cc.Show.create()),
            cc.CallFunc.create(this.finish, this)
        );
        outA = cc.Sequence.create(
            cc.Spawn.create(
                cc.OrbitCamera.create(this._duration / 2, 1, 0, outAngleZ, outDeltaZ, 0, 0),
                cc.ScaleTo.create(this._duration / 2, 0.5)),
            cc.Hide.create(),
            cc.DelayTime.create(this._duration / 2)
        );

        this._inScene.scale = 0.5;
        this._inScene.runAction(inA);
        this._outScene.runAction(outA);
    }
});

/**
 * Flips the screen horizontally doing a zoom out/in<br/>
 * The front face is the outgoing scene and the back face is the incoming scene.
 * @deprecated
 * @param {Number} t time in seconds
 * @param {cc.Scene} scene
 * @param {cc.TRANSITION_ORIENTATION_LEFT_OVER|cc.TRANSITION_ORIENTATION_RIGHT_OVER|cc.TRANSITION_ORIENTATION_UP_OVER|cc.TRANSITION_ORIENTATION_DOWN_OVER} o
 * @return {cc.TransitionZoomFlipX}
 * @example
 * // Example
 * var myTransition = cc.TransitionZoomFlipX.create(1.5, nextScene)//default is cc.TRANSITION_ORIENTATION_RIGHT_OVER
 *
 * //OR
 * var myTransition = cc.TransitionZoomFlipX.create(1.5, nextScene, cc.TRANSITION_ORIENTATION_DOWN_OVER)
 */
cc.TransitionZoomFlipX.create = function (t, scene, o) {
    return new cc.TransitionZoomFlipX(t, scene, o);
};

/**
 * Flips the screen vertically doing a little zooming out/in<br/>
 * The front face is the outgoing scene and the back face is the incoming scene.
 * @class
 * @extends cc.TransitionSceneOriented
 */
cc.TransitionZoomFlipY = cc.TransitionSceneOriented.extend(/** @lends cc.TransitionZoomFlipY# */{

    /**
     * Constructor of TransitionZoomFlipY
     * @function
     * @param {Number} t time in seconds
     * @param {cc.Scene} scene
     * @param {cc.TRANSITION_ORIENTATION_LEFT_OVER|cc.TRANSITION_ORIENTATION_RIGHT_OVER|cc.TRANSITION_ORIENTATION_UP_OVER|cc.TRANSITION_ORIENTATION_DOWN_OVER} o
     */
    ctor:function (t, scene, o) {
        cc.TransitionSceneOriented.prototype.ctor.call(this);
        o = o || cc.TRANSITION_ORIENTATION_UP_OVER;
        scene && this.initWithDuration(t, scene, o);
    },
    /**
     * custom on enter
     */
    onEnter:function () {
        cc.TransitionScene.prototype.onEnter.call(this);

        var inA, outA;
        this._inScene.visible = false;

        var inDeltaZ, inAngleZ, outDeltaZ, outAngleZ;

        if (this._orientation === cc.TRANSITION_ORIENTATION_UP_OVER) {
            inDeltaZ = 90;
            inAngleZ = 270;
            outDeltaZ = 90;
            outAngleZ = 0;
        } else {
            inDeltaZ = -90;
            inAngleZ = 90;
            outDeltaZ = -90;
            outAngleZ = 0;
        }

        inA = cc.Sequence.create(
            cc.DelayTime.create(this._duration / 2),
            cc.Spawn.create(
                cc.OrbitCamera.create(this._duration / 2, 1, 0, inAngleZ, inDeltaZ, 90, 0),
                cc.ScaleTo.create(this._duration / 2, 1), cc.Show.create()),
            cc.CallFunc.create(this.finish, this));

        outA = cc.Sequence.create(
            cc.Spawn.create(
                cc.OrbitCamera.create(this._duration / 2, 1, 0, outAngleZ, outDeltaZ, 90, 0),
                cc.ScaleTo.create(this._duration / 2, 0.5)),
            cc.Hide.create(), cc.DelayTime.create(this._duration / 2));

        this._inScene.scale = 0.5;
        this._inScene.runAction(inA);
        this._outScene.runAction(outA);
    }
});

/**
 * Flips the screen vertically doing a little zooming out/in<br/>
 * The front face is the outgoing scene and the back face is the incoming scene.
 * @deprecated
 * @param {Number} t time in seconds
 * @param {cc.Scene} scene
 * @param {cc.TRANSITION_ORIENTATION_LEFT_OVER|cc.TRANSITION_ORIENTATION_RIGHT_OVER|cc.TRANSITION_ORIENTATION_UP_OVER|cc.TRANSITION_ORIENTATION_DOWN_OVER} o
 * @return {cc.TransitionZoomFlipY}
 * @example
 * // Example
 * var myTransition = cc.TransitionZoomFlipY.create(1.5, nextScene)//default is cc.TRANSITION_ORIENTATION_UP_OVER
 *
 * //OR
 * var myTransition = cc.TransitionZoomFlipY.create(1.5, nextScene, cc.TRANSITION_ORIENTATION_DOWN_OVER)
 */
cc.TransitionZoomFlipY.create = function (t, scene, o) {
    return new cc.TransitionZoomFlipY(t, scene, o);
};

/**
 *  Flips the screen half horizontally and half vertically doing a little zooming out/in.<br/>
 * The front face is the outgoing scene and the back face is the incoming scene.
 * @class
 * @extends cc.TransitionSceneOriented
 */
cc.TransitionZoomFlipAngular = cc.TransitionSceneOriented.extend(/** @lends cc.TransitionZoomFlipAngular# */{

    /**
     * Constructor of TransitionZoomFlipAngular
     * @function
     * @param {Number} t time in seconds
     * @param {cc.Scene} scene
     * @param {cc.TRANSITION_ORIENTATION_LEFT_OVER|cc.TRANSITION_ORIENTATION_RIGHT_OVER|cc.TRANSITION_ORIENTATION_UP_OVER|cc.TRANSITION_ORIENTATION_DOWN_OVER} o
     */
    ctor:function (t, scene, o) {
        cc.TransitionSceneOriented.prototype.ctor.call(this);
        o = o || cc.TRANSITION_ORIENTATION_RIGHT_OVER;
        scene && this.initWithDuration(t, scene, o);
    },
    /**
     * custom on enter
     */
    onEnter:function () {
        cc.TransitionScene.prototype.onEnter.call(this);

        var inA, outA;
        this._inScene.visible = false;

        var inDeltaZ, inAngleZ, outDeltaZ, outAngleZ;
        if (this._orientation === cc.TRANSITION_ORIENTATION_RIGHT_OVER) {
            inDeltaZ = 90;
            inAngleZ = 270;
            outDeltaZ = 90;
            outAngleZ = 0;
        } else {
            inDeltaZ = -90;
            inAngleZ = 90;
            outDeltaZ = -90;
            outAngleZ = 0;
        }

        inA = cc.Sequence.create(
            cc.DelayTime.create(this._duration / 2),
            cc.Spawn.create(
                cc.OrbitCamera.create(this._duration / 2, 1, 0, inAngleZ, inDeltaZ, -45, 0),
                cc.ScaleTo.create(this._duration / 2, 1), cc.Show.create()),
            cc.Show.create(),
            cc.CallFunc.create(this.finish, this));
        outA = cc.Sequence.create(
            cc.Spawn.create(
                cc.OrbitCamera.create(this._duration / 2, 1, 0, outAngleZ, outDeltaZ, 45, 0),
                cc.ScaleTo.create(this._duration / 2, 0.5)),
            cc.Hide.create(), cc.DelayTime.create(this._duration / 2));

        this._inScene.scale = 0.5;
        this._inScene.runAction(inA);
        this._outScene.runAction(outA);
    }
});

/**
 *  Flips the screen half horizontally and half vertically doing a little zooming out/in.<br/>
 * The front face is the outgoing scene and the back face is the incoming scene.
 * @deprecated
 * @param {Number} t time in seconds
 * @param {cc.Scene} scene
 * @param {cc.TRANSITION_ORIENTATION_LEFT_OVER|cc.TRANSITION_ORIENTATION_RIGHT_OVER|cc.TRANSITION_ORIENTATION_UP_OVER|cc.TRANSITION_ORIENTATION_DOWN_OVER} o
 * @return {cc.TransitionZoomFlipAngular}
 * @example
 * // Example
 * var myTransition = cc.TransitionZoomFlipAngular.create(1.5, nextScene)//default is cc.TRANSITION_ORIENTATION_RIGHT_OVER
 *
 * //OR
 * var myTransition = cc.TransitionZoomFlipAngular.create(1.5, nextScene, cc.TRANSITION_ORIENTATION_DOWN_OVER)
 */
cc.TransitionZoomFlipAngular.create = function (t, scene, o) {
    return new cc.TransitionZoomFlipAngular(t, scene, o);
};

/**
 * Fade out the outgoing scene and then fade in the incoming scene.
 * @class
 * @extends cc.TransitionScene
 */
cc.TransitionFade = cc.TransitionScene.extend(/** @lends cc.TransitionFade# */{
    _color:null,

    /**
     * Constructor of TransitionFade
     * @function
     * @param {Number} t time in seconds
     * @param {cc.Scene} scene
     * @param {cc.TRANSITION_ORIENTATION_LEFT_OVER|cc.TRANSITION_ORIENTATION_RIGHT_OVER|cc.TRANSITION_ORIENTATION_UP_OVER|cc.TRANSITION_ORIENTATION_DOWN_OVER} o
     */
    ctor:function (t, scene, color) {
        cc.TransitionScene.prototype.ctor.call(this);
        this._color = cc.color();
        scene && this.initWithDuration(t, scene, color);
    },

    /**
     * custom on enter
     */
    onEnter:function () {
        cc.TransitionScene.prototype.onEnter.call(this);

        var l = new cc.LayerColor(this._color);
        this._inScene.visible = false;

        this.addChild(l, 2, cc.SCENE_FADE);
        var f = this.getChildByTag(cc.SCENE_FADE);

        var a = cc.sequence(
            cc.fadeIn(this._duration / 2),
            cc.callFunc(this.hideOutShowIn, this),
            cc.fadeOut(this._duration / 2),
            cc.callFunc(this.finish, this)
        );
        f.runAction(a);
    },

    /**
     * custom on exit
     */
    onExit:function () {
        cc.TransitionScene.prototype.onExit.call(this);
        this.removeChildByTag(cc.SCENE_FADE, false);
    },

    /**
     * initializes the transition with a duration and with an RGB color
     * @param {Number} t time in seconds
     * @param {cc.Scene} scene
     * @param {cc.Color} color
     * @return {Boolean}
     */
    initWithDuration:function (t, scene, color) {
        color = color || cc.color.BLACK;
        if (cc.TransitionScene.prototype.initWithDuration.call(this, t, scene)) {
            this._color.r = color.r;
            this._color.g = color.g;
            this._color.b = color.b;
            this._color.a = 0;
        }
        return true;
    }
});


/**
 * Fade out the outgoing scene and then fade in the incoming scene.
 * @deprecated
 * @param {Number} t time in seconds
 * @param {cc.Scene} scene
 * @param {cc.Color} color
 * @return {cc.TransitionFade}
 * @example
 * // Example
 * var myTransition = cc.TransitionFade.create(1.5, nextScene, cc.color(255,0,0))//fade to red
 */
cc.TransitionFade.create = function (t, scene, color) {
    return new cc.TransitionFade(t, scene, color);
};

/**
 * Cross fades two scenes using the cc.RenderTexture object.
 * @class
 * @extends cc.TransitionScene
 */
cc.TransitionCrossFade = cc.TransitionScene.extend(/** @lends cc.TransitionCrossFade# */{
    /**
     * Constructor of TransitionCrossFade
     * @function
     * @param {Number} t time in seconds
     * @param {cc.Scene} scene
     */
    ctor:function (t, scene) {
        cc.TransitionScene.prototype.ctor.call(this);
        scene && this.initWithDuration(t, scene);
    },
    /**
     * custom on enter
     */
    onEnter:function () {
        cc.TransitionScene.prototype.onEnter.call(this);

        // create a transparent color layer
        // in which we are going to add our rendertextures
        var color = cc.color(0, 0, 0, 0);
        var winSize = cc.director.getWinSize();
        var layer = cc.LayerColor.create(color);

        // create the first render texture for inScene
        var inTexture = cc.RenderTexture.create(winSize.width, winSize.height);

        if (null == inTexture)
            return;

        inTexture.sprite.anchorX = 0.5;
	    inTexture.sprite.anchorY = 0.5;
        inTexture.attr({
	        x: winSize.width / 2,
	        y: winSize.height / 2,
	        anchorX: 0.5,
	        anchorY: 0.5
        });

        // render inScene to its texturebuffer
        inTexture.begin();
        this._inScene.visit();
        inTexture.end();

        // create the second render texture for outScene
        var outTexture = cc.RenderTexture.create(winSize.width, winSize.height);
        outTexture.setPosition(winSize.width / 2, winSize.height / 2);
	    outTexture.sprite.anchorX = outTexture.anchorX = 0.5;
	    outTexture.sprite.anchorY = outTexture.anchorY = 0.5;

        // render outScene to its texturebuffer
        outTexture.begin();
        this._outScene.visit();
        outTexture.end();

        inTexture.sprite.setBlendFunc(cc.ONE, cc.ONE);                                             // inScene will lay on background and will not be used with alpha
        outTexture.sprite.setBlendFunc(cc.SRC_ALPHA, cc.ONE_MINUS_SRC_ALPHA);                      // we are going to blend outScene via alpha

        // add render textures to the layer
        layer.addChild(inTexture);
        layer.addChild(outTexture);

        // initial opacity:
        inTexture.sprite.opacity = 255;
        outTexture.sprite.opacity = 255;

        // create the blend action
        var layerAction = cc.Sequence.create(
            cc.FadeTo.create(this._duration, 0), cc.CallFunc.create(this.hideOutShowIn, this),
            cc.CallFunc.create(this.finish, this)
        );

        // run the blend action
        outTexture.sprite.runAction(layerAction);

        // add the layer (which contains our two rendertextures) to the scene
        this.addChild(layer, 2, cc.SCENE_FADE);
    },

    /**
     * custom on exit
     */
    onExit:function () {
        this.removeChildByTag(cc.SCENE_FADE, false);
        cc.TransitionScene.prototype.onExit.call(this);
    },

    /**
     * overide draw
     */
    draw:function () {
        // override draw since both scenes (textures) are rendered in 1 scene
    }
});

/**
 * Cross fades two scenes using the cc.RenderTexture object.
 * @deprecated
 * @param {Number} t time in seconds
 * @param {cc.Scene} scene
 * @return {cc.TransitionCrossFade}
 * @example
 * // Example
 * var myTransition = cc.TransitionCrossFade.create(1.5, nextScene)
 */
cc.TransitionCrossFade.create = function (t, scene) {
    return new cc.TransitionCrossFade(t, scene);
};

/**
 *  Turn off the tiles of the outgoing scene in random order
 * @class
 * @extends cc.TransitionScene
 */
cc.TransitionTurnOffTiles = cc.TransitionScene.extend(/** @lends cc.TransitionTurnOffTiles# */{

    /**
     * Constructor of TransitionCrossFade
     * @function
     * @param {Number} t time in seconds
     * @param {cc.Scene} scene
     */
    ctor:function (t, scene) {
        cc.TransitionScene.prototype.ctor.call(this);
        scene && this.initWithDuration(t, scene);
    },

    _sceneOrder:function () {
        this._isInSceneOnTop = false;
    },

    /**
     * custom on enter
     */
    onEnter:function () {
        cc.TransitionScene.prototype.onEnter.call(this);
        var winSize = cc.director.getWinSize();
        var aspect = winSize.width / winSize.height;
        var x = 0 | (12 * aspect);
        var y = 12;
        var toff = cc.TurnOffTiles.create(this._duration, cc.size(x, y));
        var action = this.easeActionWithAction(toff);
        this._outScene.runAction(cc.Sequence.create(action, cc.CallFunc.create(this.finish, this), cc.StopGrid.create()));
    },

    /**
     * @param {cc.ActionInterval} action
     * @return {cc.ActionInterval}
     */
    easeActionWithAction:function (action) {
        return action;
    }
});

/**
 *  Turn off the tiles of the outgoing scene in random order
 * @deprecated
 * @param {Number} t time in seconds
 * @param {cc.Scene} scene
 * @return {cc.TransitionTurnOffTiles}
 * @example
 * // Example
 * var myTransition = cc.TransitionTurnOffTiles.create(1.5, nextScene)
 */
cc.TransitionTurnOffTiles.create = function (t, scene) {
    return new cc.TransitionTurnOffTiles(t, scene);
};

/**
 *  The odd columns goes upwards while the even columns goes downwards.
 * @class
 * @extends cc.TransitionScene
 */
cc.TransitionSplitCols = cc.TransitionScene.extend(/** @lends cc.TransitionSplitCols# */{

    /**
     * Constructor of TransitionSplitCols
     * @function
     * @param {Number} t time in seconds
     * @param {cc.Scene} scene
     */
    ctor:function (t, scene) {
        cc.TransitionScene.prototype.ctor.call(this);
        scene && this.initWithDuration(t, scene);
    },
    /**
     * custom on enter
     */
    onEnter:function () {
        cc.TransitionScene.prototype.onEnter.call(this);
        this._inScene.visible = false;

        var split = this.action();
        var seq = cc.Sequence.create(
            split, cc.CallFunc.create(this.hideOutShowIn, this), split.reverse());

        this.runAction(
            cc.Sequence.create(this.easeActionWithAction(seq), cc.CallFunc.create(this.finish, this), cc.StopGrid.create())
        );
    },

    /**
     * @param {cc.ActionInterval} action
     * @return {cc.EaseInOut}
     */
    easeActionWithAction:function (action) {
        return cc.EaseInOut.create(action, 3.0);
    },

    /**
     * @return {*}
     */
    action:function () {
        return cc.SplitCols.create(this._duration / 2.0, 3);
    }
});

/**
 * The odd columns goes upwards while the even columns goes downwards.
 * @deprecated
 * @param {Number} t time in seconds
 * @param {cc.Scene} scene
 * @return {cc.TransitionSplitCols}
 * @example
 * // Example
 * var myTransition = cc.TransitionSplitCols.create(1.5, nextScene)
 */
cc.TransitionSplitCols.create = function (t, scene) {
    return new cc.TransitionSplitCols(t, scene);
};

/**
 *  The odd rows goes to the left while the even rows goes to the right.
 * @class
 * @extends cc.TransitionSplitCols
 */
cc.TransitionSplitRows = cc.TransitionSplitCols.extend(/** @lends cc.TransitionSplitRows# */{

    /**
     * Constructor of TransitionSplitRows
     * @function
     * @param {Number} t time in seconds
     * @param {cc.Scene} scene
     */
    ctor:function (t, scene) {
        cc.TransitionSplitCols.prototype.ctor.call(this);
        scene && this.initWithDuration(t, scene);
    },
    /**
     * @return {*}
     */
    action:function () {
        return cc.SplitRows.create(this._duration / 2.0, 3);
    }
});

/**
 * The odd rows goes to the left while the even rows goes to the right.
 * @deprecated
 * @param {Number} t time in seconds
 * @param {cc.Scene} scene
 * @return {cc.TransitionSplitRows}
 * @example
 * // Example
 * var myTransition = cc.TransitionSplitRows.create(1.5, nextScene)
 */
cc.TransitionSplitRows.create = function (t, scene) {
    return new cc.TransitionSplitRows(t, scene);
};

/**
 *  Fade the tiles of the outgoing scene from the left-bottom corner the to top-right corner.
 * @class
 * @extends cc.TransitionScene
 */
cc.TransitionFadeTR = cc.TransitionScene.extend(/** @lends cc.TransitionFadeTR# */{

    /**
     * Constructor of TransitionFadeTR
     * @function
     * @param {Number} t time in seconds
     * @param {cc.Scene} scene
     */
    ctor:function (t, scene) {
        cc.TransitionScene.prototype.ctor.call(this);
        scene && this.initWithDuration(t, scene);
    },
    _sceneOrder:function () {
        this._isInSceneOnTop = false;
    },

    /**
     * Custom on enter
     */
    onEnter:function () {
        cc.TransitionScene.prototype.onEnter.call(this);

        var winSize = cc.director.getWinSize();
        var aspect = winSize.width / winSize.height;
        var x = 0 | (12 * aspect);
        var y = 12;

        var action = this.actionWithSize(cc.size(x, y));
        this._outScene.runAction(
            cc.Sequence.create(this.easeActionWithAction(action), cc.CallFunc.create(this.finish, this),
                cc.StopGrid.create())
        );
    },

    /**
     * @param {cc.ActionInterval} action
     * @return {cc.ActionInterval}
     */
    easeActionWithAction:function (action) {
        return action;
    },

    /**
     * @param {cc.Size} size
     * @return {*}
     */
    actionWithSize:function (size) {
        return cc.FadeOutTRTiles.create(this._duration, size);
    }
});

/**
 *  Fade the tiles of the outgoing scene from the left-bottom corner the to top-right corner.
 * @deprecated
 * @param {Number} t time in seconds
 * @param {cc.Scene} scene
 * @return {cc.TransitionFadeTR}
 * @example
 * // Example
 * var myTransition = cc.TransitionFadeTR.create(1.5, nextScene)
 */
cc.TransitionFadeTR.create = function (t, scene) {
    return new cc.TransitionFadeTR(t, scene);
};

/**
 *  Fade the tiles of the outgoing scene from the top-right corner to the bottom-left corner.
 * @class
 * @extends cc.TransitionFadeTR
 */
cc.TransitionFadeBL = cc.TransitionFadeTR.extend(/** @lends cc.TransitionFadeBL# */{
    /**
     * Constructor of TransitionFadeBL
     * @function
     * @param {Number} t time in seconds
     * @param {cc.Scene} scene
     */
    ctor:function (t, scene) {
        cc.TransitionFadeTR.prototype.ctor.call(this);
        scene && this.initWithDuration(t, scene);
    },

    /**
     * @param {cc.Size} size
     * @return {*}
     */
    actionWithSize:function (size) {
        return cc.FadeOutBLTiles.create(this._duration, size);
    }
});

/**
 * Fade the tiles of the outgoing scene from the top-right corner to the bottom-left corner.
 * @deprecated
 * @param {Number} t time in seconds
 * @param {cc.Scene} scene
 * @return {cc.TransitionFadeBL}
 * @example
 * // Example
 * var myTransition = cc.TransitionFadeBL.create(1.5, nextScene)
 */
cc.TransitionFadeBL.create = function (t, scene) {
    return new cc.TransitionFadeBL(t, scene);
};

/**
 * Fade the tiles of the outgoing scene from the top-right corner to the bottom-left corner.
 * @class
 * @extends cc.TransitionFadeTR
 */
cc.TransitionFadeUp = cc.TransitionFadeTR.extend(/** @lends cc.TransitionFadeUp# */{

    /**
     * Constructor of TransitionFadeUp
     * @function
     * @param {Number} t time in seconds
     * @param {cc.Scene} scene
     */
    ctor:function (t, scene) {
        cc.TransitionFadeTR.prototype.ctor.call(this);
        scene && this.initWithDuration(t, scene);
    },

    /**
     * @param {cc.Size} size
     * @return {cc.FadeOutUpTiles}
     */
    actionWithSize:function (size) {
        return new cc.FadeOutUpTiles(this._duration, size);
    }
});

/**
 * Fade the tiles of the outgoing scene from the top-right corner to the bottom-left corner.
 * @deprecated
 * @param {Number} t time in seconds
 * @param {cc.Scene} scene
 * @return {cc.TransitionFadeUp}
 * @example
 * // Example
 * var myTransition = cc.TransitionFadeUp.create(1.5, nextScene)
 */
cc.TransitionFadeUp.create = function (t, scene) {
    return new cc.TransitionFadeUp(t, scene);
};

/**
 * Fade the tiles of the outgoing scene from the top to the bottom.
 * @class
 * @extends cc.TransitionFadeTR
 */
cc.TransitionFadeDown = cc.TransitionFadeTR.extend(/** @lends cc.TransitionFadeDown# */{

    /**
     * Constructor of TransitionFadeDown
     * @function
     * @param {Number} t time in seconds
     * @param {cc.Scene} scene
     */
    ctor:function (t, scene) {
        cc.TransitionFadeTR.prototype.ctor.call(this);
        scene && this.initWithDuration(t, scene);
    },

    /**
     * @param {cc.Size} size
     * @return {*}
     */
    actionWithSize:function (size) {
        return cc.FadeOutDownTiles.create( this._duration, size);
    }
});

/**
 * Fade the tiles of the outgoing scene from the top to the bottom.
 * @deprecated
 * @param {Number} t time in seconds
 * @param {cc.Scene} scene
 * @return {cc.TransitionFadeDown}
 * @example
 * // Example
 * var myTransition = cc.TransitionFadeDown.create(1.5, nextScene)
 */
cc.TransitionFadeDown.create = function (t, scene) {
    return new cc.TransitionFadeDown(t, scene);
};
