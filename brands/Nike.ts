import { Brand } from "./Brand";
import { eBrand } from "./brandTypes";
import { DrawInfo } from "./DrawInfo";

export class Nike extends Brand
{
    constructor (brand: eBrand, url: string) {
        super(brand, url);
    }

    public GetNewProduct(): DrawInfo[] {
        let product: DrawInfo[] = [];

        // ...

        return product;
    }
}