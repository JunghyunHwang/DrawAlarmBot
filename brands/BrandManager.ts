import { Brand } from "./Brand";

export class BrandManager
{
    private static instance: BrandManager = null;
    private brands: Brand[];

    private constructor() {
        this.brands = new Array();
    }

    public static GetInstance(): BrandManager {
        if (this.instance == null) {
            this.instance = new BrandManager();
        }

        return this.instance;
    }

    public AddBrand(brand: Brand): void {
        this.brands.push(brand);
    }

    public async LoadData() {
        for (const brand of this.brands) {
            await brand.LoadProductInDatabase();
        }
    }

    public CheckNewProduct(): void {
        for (const brand of this.brands) {
            
        }
    }
}