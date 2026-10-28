"""Central catalog of supported algorithms."""

ALGORITHM_REGISTRY = {
    "classification": {
        "logistic_regression": "Logistic Regression",
        "knn": "K-Nearest Neighbors",
        "decision_tree": "Decision Tree Classifier",
        "random_forest": "Random Forest Classifier",
        "svm": "Support Vector Classifier",
        "naive_bayes": "Gaussian Naive Bayes",
        "gradient_boosting": "Gradient Boosting Classifier",
        "extra_trees": "Extra Trees Classifier",
        "adaboost": "AdaBoost Classifier",
        "mlp": "Multi-layer Perceptron Classifier",
    },
    "regression": {
        "linear_regression": "Linear Regression",
        "ridge": "Ridge Regression",
        "lasso": "Lasso Regression",
        "elastic_net": "Elastic Net Regression",
        "polynomial_regression": "Polynomial Regression (degree 2)",
        "decision_tree": "Decision Tree Regressor",
        "random_forest": "Random Forest Regressor",
        "svr": "Support Vector Regression",
        "gradient_boosting": "Gradient Boosting Regressor",
        "extra_trees": "Extra Trees Regressor",
        "adaboost": "AdaBoost Regressor",
        "mlp": "Multi-layer Perceptron Regressor",
    },
    "clustering": {
        "kmeans": "K-Means",
        "mini_batch_kmeans": "Mini-Batch K-Means",
        "dbscan": "DBSCAN",
        "agglomerative": "Agglomerative Clustering",
        "gaussian_mixture": "Gaussian Mixture",
    },
    "dimensionality_reduction": {
        "pca": "Principal Component Analysis",
        "truncated_svd": "Truncated SVD",
    },
}


def get_algorithms():
    """Return a JSON-serializable copy of the algorithm catalog."""
    return {
        task: [
            {"id": algorithm_id, "name": name}
            for algorithm_id, name in algorithms.items()
        ]
        for task, algorithms in ALGORITHM_REGISTRY.items()
    }
