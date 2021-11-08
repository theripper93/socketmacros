Hooks.on("ready", () => {
  libWrapper.register(
    "socketmacros",
    "game.dnd5e.dice.DamageRoll.prototype.configureDialog",
    CustomizeDamageFormula.configureDialog,
    "MIXED"
  );
});

class CustomizeDamageFormula {
  static async configureDialog(wrapped, {title, defaultRollMode, defaultCritical=false, template, allowCritical=true}={}, options={}) {
    // If the option is not enabled, return the original function - as an alternative register\unregister would be possible
    if (false) return wrapped(...args);

    // Render the Dialog inner HTML
    const content = await renderTemplate(
      template ?? this.constructor.EVALUATION_TEMPLATE,
      {
        formula: `${this.formula} + @bonus`,
        defaultRollMode,
        rollModes: CONFIG.Dice.rollModes,
      }
    );

    // Create the Dialog window and await submission of the form
    return new Promise((resolve) => {
      new Dialog(
        {
          title,
          content,
          buttons: {
            critical: {
              condition: allowCritical,
              label: game.i18n.localize("DND5E.CriticalHit"),
              callback: (html) => resolve(this._onDialogSubmit(html, true)),
            },
            normal: {
              label: game.i18n.localize(
                allowCritical ? "DND5E.Normal" : "DND5E.Roll"
              ),
              callback: (html) => resolve(this._onDialogSubmit(html, false)),
            },
          },
          default: defaultCritical ? "critical" : "normal",
          // Inject the formula customizer - this is the only line that differs from the original
          render: (html) => {try{CustomizeDamageFormula.injectFormulaCustomizer(this, html)}catch(e){console.error(e)}},
          close: () => resolve(null),
        },
        options
      ).render(true);
    });
  }

  static injectFormulaCustomizer(damageRoll, html) {
    const item = damageRoll.data.item;
    const damageOptions = {
      default: damageRoll.formula,
      versatileDamage: item.damage.versatile,
      otherDamage: item.formula,
      parts : item.damage.parts,
    }
    const customizerSelect = CustomizeDamageFormula.buildSelect(damageOptions, damageRoll);
    const fg = $(html).find(`input[name="formula"]`).closest(".form-group");
    fg.after(customizerSelect);
    CustomizeDamageFormula.activateListeners(html, damageRoll);
  }

  static updateFormula(damageRoll, data){
    const newDiceRoll = new game.dnd5e.dice.DamageRoll(data.formula, damageRoll.data, damageRoll.options);
    CustomizeDamageFormula.updateFlavor(damageRoll, data);
    damageRoll.terms = newDiceRoll.terms;
  }

  static updateFlavor(damageRoll, data){
    const itemName = damageRoll.options.flavor.split(" - ")[0];
    const damageType = CustomizeDamageFormula.keyToText(data.damageType);
    const special = CustomizeDamageFormula.keyToText(data.key) === damageType ? "" : CustomizeDamageFormula.keyToText(data.key);
    const newFlavor = `${itemName} - ${special} ${CustomizeDamageFormula.keyToText("damageRoll")} ${damageType ? `(${damageType.replace(" - ", "")})` : ""}`;
    Hooks.once("preCreateChatMessage", (message)=>{
      message.data.update({flavor: newFlavor});
    });
  }

  static buildSelect(damageOptions, damageRoll){
    const select = $(`<select id="customize-damage-formula"></select>`);
    for(let [k,v] of Object.entries(damageOptions)){
      if(k === "parts"){
        for(let part of v){
          const index = v.indexOf(part);
          const adjustedFormula = CustomizeDamageFormula.adjustFormula(part, damageRoll);
          select.append(CustomizeDamageFormula.createOption(part[1], part, index));
        }
      }else{
        if(v) select.append(CustomizeDamageFormula.createOption(k,v));
      }
    }
    const fg = $(`<div class="form-group"><label>${CustomizeDamageFormula.keyToText("customizeFormula")}</label></div>`)
    fg.append(select);
    return fg;
  }

  static createOption(key, data, index){
    const title = CustomizeDamageFormula.keyToText(key)
    if(typeof data === "string"){
      return $(`<option data-damagetype="" data-key="${key}" data-index="" value="${data}">${title + data}</option>`);
    }else{
      return $(`<option data-damagetype="${data[1]}" data-key="${key}" data-index="${index}" value="${data[0]}">${title + data[0]}</option>`);
    }
  }

  static adjustFormula(part, damageRoll){
    if(damageRoll.data.item.level){
      //adjust for level scaling
    }
    return part;
  }

  static keyToText(key){
    //localize stuff
    switch(key){
      case "damageRoll":
        return "Damage Roll";
      case "customizeFormula":
        return "Customize Formula";
      case "versatileDamage":
        return "Versatile - ";
      case "otherDamage":
        return "Other - ";
      case "default":
        return "Default - ";
    }
    return key.charAt(0).toUpperCase() + key.slice(1) + " - ";
  }

  static activateListeners(html, damageRoll){
    $(html).find(`select[id="customize-damage-formula"]`).on("change", (e) => {
      const selected = $(e.currentTarget).find(":selected");
      $(html).find(`input[name="formula"]`).val(selected.val() + " + @bonus");
      CustomizeDamageFormula.updateFormula(damageRoll, {formula: selected.val() + " + @bonus", key : selected.data("key"), damageType: selected.data("damagetype"), partsIndex: selected.data("index")});
    })
  }

}