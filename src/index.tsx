import express from "express";
import cors from 'cors';
import { ref, onChildAdded, query, limitToLast } from "firebase/database";
import { database } from "./dto/FireBaseDB";
import { ShuttleRoute } from "./model/ShuttleRoute"
import { Passenger } from "./model/Passenger"
import { getTableItems, insertItemOnDb } from './dto/ServerHelper';
import { ShuttlePassengerLink } from "./model/ShuttlePassengerLink";
import { fromLonLat } from "ol/proj";
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { buffer } from 'ol/extent';
import _ from "lodash";
import { PassengerShuttleAction } from "./model/PassengerShuttleAction";

var app = express();
app.use(cors());

app.get('/healthcheck', (req, res) => {
    res.send("Server is running");
})

app.listen(3000, () => {
    console.log(`app is listening to port 3000`);

    getTableItems("Passenger").then((passengers: Passenger[]) => {
        console.log("passengers read")
        getTableItems("ShuttlePassengerLink").then((resultLink: ShuttlePassengerLink[]) => {
            console.log("ShuttlePassengerLink read")
            const passengersWithShuttleLink = passengers.filter((passengerItem) => {
                passengerItem.ShuttleLink = resultLink.filter(l => l.PassengerId.toString() === passengerItem.Id);
                return passengerItem.Status !== "D";
            });
            getNearest(passengersWithShuttleLink);
        });
    });
})

let sentMessageTypeClosest: string[] = [];
let sentMessageOnDoor: string[] = [];
let sentMessageOnTarget: string[] = [];

export async function getNearest(passengersWithShuttleLink: Passenger[]) {

    onChildAdded(query(ref(database, "ShuttleRoute"), limitToLast(1)), (snapshot) => {

        var data: ShuttleRoute = snapshot.val();

        const currentPoint = new Point([data.Latitude, data.Longitude]);
        var poitnExtent = currentPoint.getExtent();
        var bufferedExtentClosest = buffer(poitnExtent, 1000);
        var bufferedExtentOnDoor = buffer(poitnExtent, 10);

        const features = passengersWithShuttleLink.filter((passengerItem) => {
            return passengerItem!.ShuttleLink!.filter((linkItem) => linkItem.ShuttleId === data.ShuttleId);
        }).map((shuttlePassengerItem) => {

            let feature = new Feature({
                geometry: new Point(fromLonLat([shuttlePassengerItem.Latitude, shuttlePassengerItem.Longitude])),
            });
            feature.setId(shuttlePassengerItem.Id);
            feature.set('Info', shuttlePassengerItem.PassengerName);
            feature.set("type", 'place');

            return feature;
        });

        const vectorSource = new VectorSource({ features });

        vectorSource.forEachFeatureIntersectingExtent(bufferedExtentClosest, (item: any) => {

            if (sentMessageTypeClosest.find((sentItem) => { if (item.getId() === sentItem) { return sentItem } }) === undefined) {
                console.log(item.get('Info') + "bufferedExtentClosest");
                sendMessage(1, item.get("Id"), data.ExpeditionId, data.ShuttleId)
                sentMessageTypeClosest.push(item.getId())
            }
        });

        vectorSource.forEachFeatureIntersectingExtent(bufferedExtentOnDoor, (item: any) => {
            if (sentMessageOnDoor.find((sentItem) => { if (item.getId() === sentItem) { return sentItem } }) === undefined) {
                console.log(item.get('Info') + "bufferedExtentOnDoor");
                sendMessage(2, item.getId(), data.ExpeditionId, data.ShuttleId)
                sentMessageOnDoor.push(item.getId())
            }
        });

        const targetPoint = new Point([36.1212, 36.234242]);
        var bufferedExtentTarget = buffer(currentPoint.getExtent(), 10);

        if (targetPoint.intersectsExtent(bufferedExtentTarget)) {
            vectorSource.forEachFeature((item: any) => {
                if (sentMessageOnTarget.find((sentItem) => { if (item.getId() === sentItem) { return sentItem } }) === undefined) {
                    console.log(item.get('Info') + "bufferedExtentTarget");
                    sendMessage(6, item.getId(), data.ExpeditionId, data.ShuttleId)
                    sentMessageOnTarget.push(item.getId())
                }
            });
        }
    });
}

export async function sendMessage(passsengerStatus: number, passengerId: string, expeditionId: string, shuttleId: string) {
    const item = {
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
    } as PassengerShuttleAction

    insertItemOnDb("PassengerShuttleAction", item);
}

