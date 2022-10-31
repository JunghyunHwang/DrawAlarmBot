import { eBrand } from "./brandTypes"

export class DrawInfo
{
    public brandType: eBrand;
    public typeName: string;
    public sneakersName: string;
    public price: number;
    public url: string;
    public startTime: Date;
    public endTime: Date;
    public imgUrl: string;

    public Equals(other: DrawInfo): boolean {
        return (this.brandType == other.brandType 
                && this.url == other.url
                && this.imgUrl == other.imgUrl);
    }
}

