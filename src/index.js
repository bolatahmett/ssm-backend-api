var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import express from "express";
import cors from 'cors';
import { ref, onChildAdded, query, limitToLast } from "firebase/database";
import { database } from "./dto/FireBaseDB";
import { getTableItems, insertItemOnDb } from './dto/ServerHelper';
import { fromLonLat } from "ol/proj";
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { buffer } from 'ol/extent';
var app = express();
app.use(cors());
app.get('/healthcheck', function (req, res) {
    res.send("Server is running");
});
app.listen(3000, function () {
    console.log("app is listening to port 3000");
    getTableItems("Passenger").then(function (passengers) {
        getTableItems("ShuttlePassengerLink").then(function (resultLink) {
            var passengersWithShuttleLink = passengers.filter(function (passengerItem) {
                passengerItem.ShuttleLink = resultLink.filter(function (l) { return l.PassengerId.toString() === passengerItem.Id; });
                return passengerItem.Status !== "D";
            });
            console.log(passengersWithShuttleLink.length);
            getNearest(passengersWithShuttleLink);
        });
    });
});
var sentMessageTypeClosest = [];
var sentMessageOnDoor = [];
var sentMessageOnTarget = [];
export function getNearest(passengersWithShuttleLink) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            onChildAdded(query(ref(database, "ShuttleRoute"), limitToLast(1)), function (snapshot) {
                var data = snapshot.val();
                var currentPoint = new Point(fromLonLat([data.Longitude, data.Latitude]));
                var shuttlePasssengers = passengersWithShuttleLink.filter(function (item) {
                    var _a;
                    return item.Status !== "D" && ((_a = item.ShuttleLink) === null || _a === void 0 ? void 0 : _a.some(function (sl) { return sl.ShuttleId.toString() === data.ShuttleId.toString(); }));
                });
                var features = shuttlePasssengers.map(function (shuttlePassengerItem) {
                    var feature = new Feature({
                        geometry: new Point(fromLonLat([shuttlePassengerItem.Longitude, shuttlePassengerItem.Latitude])),
                    });
                    feature.setId(shuttlePassengerItem.Id);
                    feature.set('Info', shuttlePassengerItem.PassengerName);
                    feature.set("type", 'place');
                    return feature;
                });
                var vectorSource = new VectorSource({ features: features });
                var bufferedExtentClosest = buffer(currentPoint.getExtent(), 1000);
                vectorSource.forEachFeatureIntersectingExtent(bufferedExtentClosest, function (item) {
                    if (sentMessageTypeClosest.find(function (sentItem) { if ("".concat(item.getId(), "-").concat(data.ExpeditionId) === sentItem) {
                        return sentItem;
                    } }) === undefined) {
                        console.log(item.get('Info') + " x metre yak??na geldi.");
                        sendMessage(1, item.getId(), data.ExpeditionId, data.ShuttleId);
                        sentMessageTypeClosest.push("".concat(item.getId(), "-").concat(data.ExpeditionId));
                    }
                });
                var bufferedExtentOnDoor = buffer(currentPoint.getExtent(), 100);
                vectorSource.forEachFeatureIntersectingExtent(bufferedExtentOnDoor, function (item) {
                    if (sentMessageOnDoor.find(function (sentItem) { if ("".concat(item.getId(), "-").concat(data.ExpeditionId) === sentItem) {
                        return sentItem;
                    } }) === undefined) {
                        console.log(item.get('Info') + "servis kap??da.");
                        sendMessage(2, item.getId(), data.ExpeditionId, data.ShuttleId);
                        sentMessageOnDoor.push("".concat(item.getId(), "-").concat(data.ExpeditionId));
                    }
                });
                var targetPoint = new Point(fromLonLat([36.22067765094101, 36.10080801701309]));
                var bufferedExtentTarget = buffer(currentPoint.getExtent(), 100);
                if (targetPoint.intersectsExtent(bufferedExtentTarget)) {
                    vectorSource.forEachFeature(function (item) {
                        if (sentMessageOnTarget.find(function (sentItem) { if ("".concat(item.getId(), "-").concat(data.ExpeditionId) === sentItem) {
                            return sentItem;
                        } }) === undefined) {
                            console.log(item.get('Info') + " hedef noktaya ula??t??.");
                            sendMessage(6, item.getId(), data.ExpeditionId, data.ShuttleId);
                            sentMessageOnTarget.push("".concat(item.getId(), "-").concat(data.ExpeditionId));
                        }
                    });
                }
            });
            return [2 /*return*/];
        });
    });
}
export function sendMessage(passsengerStatus, passengerId, expeditionId, shuttleId) {
    return __awaiter(this, void 0, void 0, function () {
        var item;
        return __generator(this, function (_a) {
            item = {
                PassengerId: passengerId,
                ShuttleId: shuttleId,
                ExpeditionId: expeditionId,
                DriverId: "",
                StartedTime: "",
                EndedTime: passsengerStatus === 5 ? new Date().toLocaleString() : "",
                PassengerStatus: passsengerStatus,
                DateTime: new Date().toLocaleString(),
                Status: "N",
                Id: ""
            };
            insertItemOnDb("PassengerShuttleAction", item);
            return [2 /*return*/];
        });
    });
}
