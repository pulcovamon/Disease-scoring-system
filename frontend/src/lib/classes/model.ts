export interface ModelMetrics {
	accuracy: number
	precision: number
	recall: number
	f1: number
	roc_auc: number
}

export interface Model {
	_id: string|null,
	user: string|null,
	path: string|null,
	name: string,
	disease: string,
	model_type: string|null,
	recommended: boolean|null,
	summary: string|null,
	description: string|null,
	image: string | null,
	is_public: boolean,
	encoder: string|null,
	algorithm: string|null,
	accuracy: number|null,
	metrics: ModelMetrics|null,
}
