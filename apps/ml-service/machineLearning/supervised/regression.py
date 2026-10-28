"""Regression algorithm factories."""

from sklearn.ensemble import (
    AdaBoostRegressor,
    ExtraTreesRegressor,
    GradientBoostingRegressor,
    RandomForestRegressor,
)
from sklearn.linear_model import ElasticNet, Lasso, LinearRegression, Ridge
from sklearn.neural_network import MLPRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import PolynomialFeatures
from sklearn.svm import SVR
from sklearn.tree import DecisionTreeRegressor

REGRESSORS = {
    "linear_regression": lambda: LinearRegression(),
    "ridge": lambda: Ridge(),
    "lasso": lambda: Lasso(max_iter=5000),
    "elastic_net": lambda: ElasticNet(max_iter=5000),
    "polynomial_regression": lambda: Pipeline(
        steps=[
            ("polynomial_features", PolynomialFeatures(degree=2, include_bias=False)),
            ("linear_regression", LinearRegression()),
        ]
    ),
    "decision_tree": lambda: DecisionTreeRegressor(random_state=42),
    "random_forest": lambda: RandomForestRegressor(n_estimators=200, random_state=42),
    "svr": lambda: SVR(),
    "gradient_boosting": lambda: GradientBoostingRegressor(random_state=42),
    "extra_trees": lambda: ExtraTreesRegressor(n_estimators=200, random_state=42),
    "adaboost": lambda: AdaBoostRegressor(random_state=42),
    "mlp": lambda: MLPRegressor(hidden_layer_sizes=(100,), max_iter=500, random_state=42),
}
