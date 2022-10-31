import { eBrand } from "./eBrandTypes";
import { ProductInfo } from "./ProductInfo";
import { db } from "../config/Database";

export abstract class Brand
{
    protected readonly brandType: eBrand;
    protected readonly url: string;
    protected readonly brandName: string;

    constructor(brand: eBrand, url: string) {
        this.brandType = brand;
        this.url = url;

        switch (this.brandType) {
            case eBrand.NIKE:
                this.brandName = "Nike";
                break;
            default:
                break;
        }
    }

    public get GetBrandType(): eBrand {
        return this.brandType;
    }

    public get GetUrl(): string {
        return this.url;
    }

    public abstract GetNewProduct(products: ProductInfo[]): ProductInfo[];

    public getProductInfoInDatabase(): ProductInfo[] {
        let result: ProductInfo[];
	    const DRAW_INFO_SQL: string = "SELECT full_name FROM draw_info WHERE brand_name=?";

        db.query(DRAW_INFO_SQL, [this.brandName], (err, productDatas) => {
            console.log(typeof(productDatas));
            console.log(productDatas);
        });
        
        return result;
    }
}