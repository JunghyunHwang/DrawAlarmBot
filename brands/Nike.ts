import { Brand } from "./Brand";
import { eBrand } from "./eBrandTypes"
import { ProductInfo } from "./ProductInfo";

export class Nike extends Brand
{
    constructor (brand: eBrand, url: string) {
        super(brand, url);
    }

    public GetNewProduct(products: ProductInfo[]): ProductInfo[] {
        
        let product: ProductInfo[] = [];

        // ...

        return product;
    }
}