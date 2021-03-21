'use strict';

var ari = require('ari-client');
ari.connect('http://localhost:8088', 'audarari', 'zaq1xsw2cde3', clientLoaded);

/** ARI Client Function */
function clientLoaded(err, client) {
    if (err) {
        throw err;
    }

    // Listener DeviceState 
    client.on('DeviceStateChanged', function (event, device_state) {
        console.log(`DeviceStateChanged : `, device_state);
    });

    // Listener ChannelHangup
    client.on('ChannelHangupRequest', function (event, channel) {
        console.log(`ChannelHangupRequest : ${channel.name} - ${channel.state}`);
    });

    /** Device States */
    client.deviceStates.list(
        function (err, devicestates) {
            console.log(`Device : `, devicestates);
        }
    );

    /** Start Stasis */
    client.on('StasisStart', function (event, incoming) {
        console.log("StasisStart");

        var opts = {
            deviceName: 'Stasis:VoxApp',
            deviceState: 'BUSY'
        };
        client.deviceStates.update(opts, function (err) { });

        incoming.answer(function (err, channel) {
            console.log("Incoming : " + incoming.id);
            play(incoming, 'sound:demo-congrats', function (err) {
                incoming.hangup(function (err) {
                    console.log("Hangup Channel : " + incoming.id);
                });
            });
        });

        /** List Channels */
        client.channels.list(function (err, channels) {
            if (!channels.length) {
                console.log(' + No channels currently :-(');
            } else {
                console.log(' :: Current channels:');
                channels.forEach(function (channel) {
                    console.log("  - Channel: " + channel.name);
                });
            }
        });
    });

    /** End Stasis */
    client.on('StasisEnd', function (event, incoming) {
        console.log("StasisEnd");
        var opts = {
            deviceName: 'Stasis:VoxApp',
            deviceState: 'NOT_INUSE'
        };
        client.deviceStates.update(opts, function (err) { });
    });

    /** Playback */
    function play(channel, sound, callback) {
        var playback = client.Playback();
        playback.once('PlaybackFinished',
            function (event, instance) {
                if (callback) {
                    callback(null);
                }
            });
        channel.play({ media: sound }, playback, function (err, playback) { });
    }

    client.start('voxapp');
}
