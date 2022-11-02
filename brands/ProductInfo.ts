export class ProductInfo
{
    public brandName: string;
    public typeName: string;
    public sneakersName: string;
    public price: number;
    public url: string;
    public startTime: Date;
    public endTime: Date;
    public imgUrl: string;

    public Equals(other: ProductInfo): boolean {
        return (this.brandName == other.brandName 
                && this.url == other.url
                && this.imgUrl == other.imgUrl);
    }
}

