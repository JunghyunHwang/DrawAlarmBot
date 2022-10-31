import { Nike } from "./brands/Nike.js";
import { eBrand } from "./brands/eBrandTypes";

let n: Nike = new Nike(eBrand.NIKE, "https://www.nike.com/kr/launch");

n.getProductInfoInDatabase();