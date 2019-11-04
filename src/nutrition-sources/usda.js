import axios from "axios";
import env from "../env";
let np = require("nested-property");


export default class USDA {
    constructor({usda_upc_endpoint, usda_key, usda_fdic_endpoint}={}) {
        this.appKey = usda_key || env.usda_key;
        this.fdcidEndpoint = usda_fdic_endpoint || env.usda_fdcid_endpoint;
        this.upcEndpoint = usda_upc_endpoint || env.usda_upc_endpoint;
        this.source = "usda";
        //console.log(this.appKey, this.upcEndpoint)
    }

    getNutritionByUPC(options, success, notfound, fail) {
        
        const upc = options.barcode;
        if (isNaN(upc)) {
            fail(new Error("Not a UPC barcde"))
            return;
        }
        const key = options.appId && options.appKey || this.appKey;
        const url = this.fdcidEndpoint + key;
        axios.post(url, { "generalSearchInput": upc })
            .then(response => {
                if (response.totalHits < 1) {
                    notfound(response);
                    return;
                }
                else {
                    let fdcid = response.data.foods[0].fdcId
                    
                    let fdcidUrl = this.upcEndpoint + fdcid +"?api_key=" + key;
                    //console.log(url, "\n", upc,  "\n", fdcid, "\n", fdcidUrl);
                  
                    axios.get(fdcidUrl)
                    .then(response2 => {
                        success(this.convertFoodDataToSchema(response2.data));
                    })
                    .catch( err => fail(err))
                }
            })
            .catch( err => fail(err))
    }
    convertFoodDataToSchema(old_data) {
        return {
            "item_name": np.get(old_data, "description"),
            "nf_ingredient_statement": np.get(old_data, "ingredients"),
            "nf_water_grams": null,
            "nf_calories": np.get(old_data, "labelNutrients.calories.value"),
            "nf_calories_from_fat": np.get(old_data, "product.labelNutrients.fat.value") * 9,
            "nf_total_fat": np.get(old_data, "labelNutrients.fat.value"),
            "nf_saturated_fat": np.get(old_data, "labelNutrients.saturatedFat.value"),
            "nf_trans_fatty_acid": np.get(old_data, "labelNutrients.transFat.value"),
            "nf_cholesterol": np.get(old_data, "labelNutrients.cholesterol.value"),
            "nf_sodium": np.get(old_data, "labelNutrients.sodium.value"),
            "nf_total_carbohydrate": np.get(old_data, "labelNutrients.carbohydrates.value"),
            "nf_dietary_fiber": np.get(old_data, "labelNutrients.fiber.value"),
            "nf_sugars": np.get(old_data, "labelNutrients.sugars.value"),
            "nf_protein": np.get(old_data, "labelNutrients.protein.value"),
            "nf_vitamin_a_dv": null,
            "nf_vitamin_c_dv": null,
            "nf_calcium_dv": np.get(old_data, "labelNutrients.calcium.value"),
            "nf_iron_dv": np.get(old_data, "labelNutrients.iron.value")
          }
    }
}
