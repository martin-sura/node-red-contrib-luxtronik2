module.exports = function (RED) {
    "use strict";

    var luxtronik = require('luxtronik2');

    function Luxtronik2ReadNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var pump = luxtronik.createConnection(config.host, config.port, {
            onProcessValues: function (heatpumpValues) {
                var extra = {};
                if (heatpumpValues.length > 183) {
                    extra.brine_pump = heatpumpValues[183];
                }
                if (heatpumpValues.length > 231) {
                    extra.inverter_frequency = heatpumpValues[231];
                }
                if (heatpumpValues.length > 236) {
                    extra.inverter_frequency_setpoint = heatpumpValues[236];
                }
                if (heatpumpValues.length > 241) {
                    extra.water_pump = heatpumpValues[241];
                }
                if (heatpumpValues.length > 257) {
                    extra.current_power = heatpumpValues[257] / 1000;
                }
                return extra;
            },
            onProcessParameters: function (heatpumpParameters) {
                var extra = {};
                if (heatpumpParameters.length > 1059) {
                    extra.thermalenergy_2nd_heat_source = heatpumpParameters[1059] / 10;
                }
                return extra;
            }
        });

        node.on('input', function (msg) {
            pump.read(function (err, data) {
                if (err) {
                    node.error(err, msg);
                    return;
                }
                msg.payload = data;
                node.send(msg);
            });
        });
    }
    RED.nodes.registerType("luxtronik2 read", Luxtronik2ReadNode);

    function Luxtronik2WriteNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var pump = luxtronik.createConnection(config.host, config.port);

        node.on('input', function (msg) {
            var parameterName = config.parameter || msg.parameter;
            var parameterValue = msg.payload;
            var rawParameter = msg.raw_parameter;

            if(rawParameter !== undefined) {
                pump.writeRaw(rawParameter, parameterValue, function (err, data) {
                    if (err) {
                        node.error(err, msg);
                    } else {
                        msg.payload = data;
                        node.send(msg);
                    }
                });
            } else {
                pump.write(parameterName, parameterValue, function (err, data) {
                        if (err) {
                            msg.payload = err;
                            return node.send(msg);
                        }
                        msg.payload = data;
                        node.send(msg);
                    });
            }
        });
    }
    RED.nodes.registerType("luxtronik2 write", Luxtronik2WriteNode);
}
