import { Nike } from "./brands/Nike.js";
import { Brand } from "./brands/Brand.js";
import { ProductInfo } from "./brands/ProductInfo.js";

let nike: Brand = new Nike("Nike", "https://www.nike.com/kr/launch");

let products: readonly ProductInfo[] = nike.GetUpcommingProducts();

// for (let i = 0;  i < products.length; ++i) {
//     console.log(`Brand name: ${products[i].brandName}`);
//     console.log(`Type name: ${products[i].typeName}`);
//     console.log(`Sneakers name: ${products[i].sneakersName}`);
//     console.log(`Price: ${products[i].price}`);
//     console.log(`url: ${products[i].url}`);
//     console.log(`Start time: ${products[i].startTime}`);
//     console.log(`End time: ${products[i].endTime}`);
//     console.log(`Image url: ${products[i].imgUrl}`);
// }