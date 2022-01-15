export interface ShuttleBaseRoute {
    Id: string,
    ShuttleId: string;
    DriverId: string;
    CarId: string;
    Lon: number;
    Lat: number;
    RouteId: number;
    StartDatetime: string;
    FinishDatetime: string;
    ApproachedMessageDistance: number;
    CameMessageDistance: number;
    Status: boolean;
}