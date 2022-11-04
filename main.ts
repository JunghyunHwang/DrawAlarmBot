import { Nike } from "./brands/Nike.js";
import { Brand } from "./brands/Brand.js";
import { ProductInfo } from "./brands/ProductInfo.js";
import { BrandManager } from "./brands/BrandManager.js";

const brandManager: BrandManager = BrandManager.GetInstance();
let nike: Brand = new Nike("Nike", "https://www.nike.com/kr/launch");

brandManager.AddBrand(nike);
brandManager.LoadData().then(() => {
    main();
});

function main(): void {
    let nikeProducts: readonly ProductInfo[] = nike.GetUpcommingProducts();

    for (let i = 0; i < nikeProducts.length; ++i) {
        console.log(`Brand name: ${nikeProducts[i].brandName}`);
        console.log(`Type name: ${nikeProducts[i].typeName}`);
        console.log(`Sneakers name: ${nikeProducts[i].sneakersName}`);
        console.log(`Price: ${nikeProducts[i].price}`);
        console.log(`URL: ${nikeProducts[i].url}`);
        console.log(`Start time: ${nikeProducts[i].startTime}`);
        console.log(`End time: ${nikeProducts[i].endTime}`);
        console.log(`Image url: ${nikeProducts[i].imgUrl}`);
        console.log("------------------------------------------");
    }
}