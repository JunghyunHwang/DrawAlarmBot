import { eBrand } from "./brandTypes";
import { DrawInfo } from "./DrawInfo";

export abstract class Brand
{
    protected readonly brandType: eBrand;
    protected readonly url: string;

    constructor(brand: eBrand, url: string) {
        this.brandType = brand;
        this.url = url;
    }

    public get GetBrandType(): eBrand {
        return this.brandType;
    }

    public get GetUrl(): string {
        return this.url;
    }

    public abstract GetNewProduct(): DrawInfo[];
}