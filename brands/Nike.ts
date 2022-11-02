import { Brand } from "./Brand";
import { ProductInfo } from "./ProductInfo";

export class Nike extends Brand
{
    constructor (name: string, url: string) {
        super(name, url);
    }

    public GetNewProduct(products: ProductInfo[]): ProductInfo[] {
        
        let product: ProductInfo[] = [];

        // ...

        return product;
    }
}