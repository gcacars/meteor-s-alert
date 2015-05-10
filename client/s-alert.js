'use strict';

// helper functions
var conditionSet = function (self, msg, condition, customSettings) {
    var settings = {};
    var effects = ['jelly', 'genie', 'stackslide', 'scale', 'slide', 'flip', 'bouncyflip'];
    var currentEffect;
    var sAlertId;
    
    if (!_.isObject(customSettings)) {
        customSettings = {};
    }
    
    if (_.isObject(msg) && _.isString(condition)) {
        settings = _.extend(settings, self.settings, msg, {condition: condition}, customSettings);
    }
    
    if (_.isString(msg) && _.isString(condition)) {
        settings = _.extend(settings, self.settings, {message: msg}, {condition: condition}, customSettings);
    }
    
    currentEffect = settings && settings.effect;
    if (_.contains(effects, currentEffect) && !Package['juliancwirko:s-alert-' + currentEffect] && typeof console !== 'undefined') {
        console.info('Install "' + currentEffect + '" effect by running "meteor add juliancwirko:s-alert-' + currentEffect + '"');
    }
    
    if (_.isObject( settings )) {
        sAlertId = sAlert.collection.insert( settings );
        
        if (_.isFunction( settings.onClick )){
            sAlert.callbacks[ 'call_' + sAlertId ] = settings.onClick;
        }
    }
    
    return sAlertId;
};

var EVENTS = 'webkitAnimationEnd oAnimationEnd animationEnd msAnimationEnd animationend';

var sAlertClose = function (alertId) {
    var closingTimeout;
    
    if (document.hidden || document.webkitHidden || $('.s-alert-box').css('animationName') === 'none') {
        sAlert.collection.remove(alertId);
        
    } else {
        $('.s-alert-box#' + alertId).removeClass('s-alert-show');
        
        closingTimeout = Meteor.setTimeout(function () {
            $('.s-alert-box#' + alertId).addClass('s-alert-hide');
        }, 100);
        
        $('.s-alert-box#' + alertId).off(EVENTS);
        $('.s-alert-box#' + alertId).on(EVENTS, function () {
            $(this).hide();
            sAlert.collection.remove(alertId);
            Meteor.clearTimeout(closingTimeout);
        });
    }
};

// sAlert object
sAlert = {
    settings: {
        effect: '',
        position: 'right-top',
        timeout: 5000,
        html: false,
        showClose: true,
        router: true,
        offset: 0,
        onClick: {}
    },
    
    config: function (configObj) {
        var self = this;
        
        if (_.isObject( configObj )) {
            self.settings = _.extend( self.settings, configObj );
            
            if (self.settings.offset){
                if (/top/g.test( self.settings.position )){
                    $('.s-alert').css( 'top', self.settings.offset );
                    
                } else if (/bottom/g.test( self.settings.position )){
                    $('.s-alert').css( 'bottom', self.settings.offset );
                }
            }
            
        } else {
            throw new Meteor.Error(400, 'sAlert: Config must be an object!');
        }
    },
    
    closeAll: function () {
        sAlert.collection.remove({});
    },
    
    close: function (id) {
        if (_.isString( id )) {
            var next = _.isFunction( this.settings.onClick ) ? this.settings.onClick() : true;
            if (next || next === undefined) sAlertClose( id );
        }
    },
    
    info: function (msg, customSettings) {
        return conditionSet(this, msg, 'info', customSettings);
    },
    error: function (msg, customSettings) {
        return conditionSet(this, msg, 'error', customSettings);
    },
    success: function (msg, customSettings) {
        return conditionSet(this, msg, 'success', customSettings);
    },
    warning: function (msg, customSettings) {
        return conditionSet(this, msg, 'warning', customSettings);
    },
    
    // Alert callbacks
    callbacks: {}
};

// routers clean
Meteor.startup(function () {
    if (typeof Iron !== 'undefined' && typeof Router !== 'undefined') {
        if (sAlert.settings.router){
            Router.onStop(function () {
                sAlert.collection.remove({});
            });
        }
    }
    
    if (typeof FlowRouter !== 'undefined') {
        if (sAlert.settings.router){
            FlowRouter.middleware(function (path, next) {
                sAlert.collection.remove({});
                next();
            });
        }
    }
});
