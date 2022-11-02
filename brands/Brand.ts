import { ProductInfo } from "./ProductInfo";
import { db } from "../config/Database";

export abstract class Brand
{
    protected readonly brandName: string;
    protected readonly url: string;
    protected upcommingProducts: ProductInfo[];

    constructor(name: string, url: string) {
        this.brandName = name;
        this.url = url;
        this.upcommingProducts = new Array();

        this.LoadProductInDatabase();
    }

    public get GetUrl(): string {
        return this.url;
    }

    public abstract GetNewProduct(products: ProductInfo[]): ProductInfo[];

    public LoadProductInDatabase(): void {
	    const DRAW_INFO_SQL: string = "SELECT brand_name, type_name, sneakers_name, product_price, product_url, draw_start_time, draw_end_time, img_url FROM draw_info WHERE brand_name=?";
        
        db.query(DRAW_INFO_SQL, [this.brandName], (err, productDatas) => {
            if (err) {
                console.log("Error");
                return;
            }

            for (let data of productDatas) {

                let product: ProductInfo = new ProductInfo();
                product.brandName = data.brand_name;
                product.typeName = data.type_name;
                product.sneakersName = data.sneakers_name;
                product.price = data.product_price;
                product.url = data.product_url;
                product.startTime = data.draw_start_time;
                product.endTime = data.draw_end_time;
                product.imgUrl = data.img_url;

                this.upcommingProducts.push(product);
            }
        });
    }

    public GetUpcommingProducts(): readonly ProductInfo[] {
        return this.upcommingProducts;
    }
}