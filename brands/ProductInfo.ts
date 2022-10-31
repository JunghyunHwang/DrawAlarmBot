import { eBrand } from "./eBrandTypes"

export class ProductInfo
{
    public brandType: eBrand;
    public typeName: string;
    public sneakersName: string;
    public price: number;
    public url: string;
    public startTime: Date;
    public endTime: Date;
    public imgUrl: string;

    public Equals(other: ProductInfo): boolean {
        return (this.brandType == other.brandType 
                && this.url == other.url
                && this.imgUrl == other.imgUrl);
    }
}

