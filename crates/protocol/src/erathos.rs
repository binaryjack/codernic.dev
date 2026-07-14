use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, Default)]
pub enum EntityStatus {
    #[serde(alias = "planned", alias = "Planned")]
    #[default]
    Planned,
    #[serde(alias = "in_progress", alias = "InProgress")]
    InProgress,
    #[serde(alias = "done", alias = "Done")]
    Done,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ErathosEntity {
    pub id: String,
    pub name: String,
    pub template_id: String, // e.g., "agent_node"
    #[serde(default)]
    pub status: EntityStatus,
    #[serde(default)]
    pub progress: u8,
    pub properties: serde_json::Value, // Dynamically validated payload against template_id JSON Schema
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ErathosLink {
    pub id: String,
    pub source: String,
    pub target: String,
    pub label: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ErathosSchemaContract {
    pub schema_id: String,
    pub description: Option<String>,
    #[serde(default)]
    pub entities: Vec<ErathosEntity>,
    #[serde(default)]
    pub links: Vec<ErathosLink>,
}

impl ErathosSchemaContract {
    /// Validates the schema's entities against a set of provided JSON schemas dynamically
    pub fn validate(&self, template_resolver: impl Fn(&str) -> Option<serde_json::Value>) -> Result<(), String> {
        for entity in &self.entities {
            let schema_value = template_resolver(&entity.template_id)
                .ok_or_else(|| format!("Template {} not found for entity {}", entity.template_id, entity.id))?;
            
            let validator = jsonschema::JSONSchema::compile(&schema_value)
                .map_err(|e| format!("Invalid JSON Schema for template {}: {}", entity.template_id, e))?;
                
            if let Err(errors) = validator.validate(&entity.properties) {
                let err_msgs: Vec<String> = errors.map(|e| e.to_string()).collect();
                return Err(format!("Entity {} failed validation against {}: {:?}", entity.id, entity.template_id, err_msgs));
            }
        }
        Ok(())
    }
}
