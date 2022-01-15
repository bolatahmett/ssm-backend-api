import { Shuttle } from "./Shuttle";

export interface ShuttleAction extends Shuttle {
    IsInProgress: boolean;
    RouteId: string;
}