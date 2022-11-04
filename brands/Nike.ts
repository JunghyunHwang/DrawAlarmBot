import axios from "axios";
import { load } from 'cheerio';
import { Brand } from "./Brand";
import { ProductInfo } from "./ProductInfo";

export class Nike extends Brand
{
    constructor (name: string, url: string) {
        super(name, url);
    }

    public async GetNewProduct(): Promise<ProductInfo[]> {
        
        let product: ProductInfo[] = [];

        const html = await axios.get(this.url);
        
        return product;
    }
}