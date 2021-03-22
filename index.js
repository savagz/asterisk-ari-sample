'use strict';

var ari = require('ari-client');
ari.connect('http://localhost:8088', 'adminari', 'q1w2e3r4t5y6', clientLoaded);

/** ARI Client Function */
function clientLoaded(err, client) {
    if (err) {
        throw err;
    }

    // Listener DeviceState 
    client.on('DeviceStateChanged', (event, device_state) => {
        console.log(`· DeviceStateChanged : `, device_state);
    });

    // Listener ChannelHangup
    client.on('ChannelHangupRequest', (event, channel) => {
        console.log(`· ChannelHangupRequest : ${channel.name} - ${channel.state}`);
    });

    /** Listener Start Stasis */
    client.on('StasisStart', (event, incoming) => {
        console.log(`- Stasis Start for Channel ID : ${incoming.id}`);

        // Change DeviceState
        var opts = {
            deviceName: 'Stasis:VoxApp',
            deviceState: 'BUSY'
        };
        client.deviceStates.update(opts, (err) => { });

        // Send a Playback
        incoming.answer((err, channel) => {
            console.log(`· Answered Channel ID : ${incoming.id}`);
            // Device States
            client.deviceStates.list(
                (err, devicestates) => {
                    devicestates.forEach((device) => {
                        console.log(` - Device: ${device.name} - ${device.state}`);
                    });
                }
            );
            // Playback
            play(incoming, 'sound:demo-congrats', (err) => {
                // Playback Completed - Send a Hangup Channel
                incoming.hangup((err) => {
                    console.log(`· Hangup Channel ID : ${incoming.id}`);
                });
            });
        });

        /** List Channels */
        client.channels.list((err, channels) => {
            if (!channels.length) {
                console.log(' + No channels currently :-(');
            } else {
                console.log(' :: Current channels:');
                channels.forEach((channel) => {
                    console.log(` - Channel: ${channel.name}`);
                });
            }
        });
    });

    /** Listener End Stasis */
    client.on('StasisEnd', (event, incoming) => {
        console.log(`Stasis End ID ${incoming.id} ... Update Device State`);
        var opts = {
            deviceName: 'Stasis:VoxApp',
            deviceState: 'NOT_INUSE'
        };
        client.deviceStates.update(opts, (err) => {
            // Device States
            client.deviceStates.list(
                (err, devicestates) => {
                    devicestates.forEach((device) => {
                        console.log(` - Device: ${device.name} - ${device.state}`);
                    });
                }
            );
        });
    });

    /** Function for Playback a Sound */
    function play(channel, sound, callback) {
        var playback = client.Playback();
        playback.once('PlaybackFinished',
            function (event, instance) {
                if (callback) {
                    callback(null);
                }
            });
        channel.play({ media: sound }, playback, (err, playback) => { });
    }

    client.start('voxapp');
}
