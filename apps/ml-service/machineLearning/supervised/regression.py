
"""Regression algorithm factories.

All estimators are created through factories so every training
request receives a fresh, unfitted estimator.
"""
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import PolynomialFeatures

from sklearn.ensemble import (
    AdaBoostRegressor,
    BaggingRegressor,
    ExtraTreesRegressor,
    GradientBoostingRegressor,
    HistGradientBoostingRegressor,
    RandomForestRegressor,
)

from sklearn.kernel_ridge import KernelRidge

from sklearn.linear_model import (
    BayesianRidge,
    ElasticNet,
    GammaRegressor,
    HuberRegressor,
    Lasso,
    LinearRegression,
    LinearRegression,
    PassiveAggressiveRegressor,
    PoissonRegressor,
    QuantileRegressor,
    Ridge,
    SGDRegressor,
    TheilSenRegressor,
    TweedieRegressor,
)

from sklearn.neighbors import KNeighborsRegressor

from sklearn.neural_network import MLPRegressor

from sklearn.svm import (
    LinearSVR,
    NuSVR,
    SVR,
)

from sklearn.tree import DecisionTreeRegressor


REGRESSORS = {
    # --------------------------------------------------------
    # 1. Linear regression algorithms
    # --------------------------------------------------------

    "linear_regression": lambda: LinearRegression(),

    "ridge": lambda: Ridge(alpha=1.0),

    "lasso": lambda: Lasso(
        alpha=1.0,
        max_iter=5000,
    ),

    "elastic_net": lambda: ElasticNet(
        alpha=1.0,
        max_iter=5000,
    ),

    "bayesian_ridge": lambda: BayesianRidge(),

    "huber": lambda: HuberRegressor(
        max_iter=1000,
    ),

    "sgd_regressor": lambda: SGDRegressor(
        max_iter=2000,
        random_state=42,
    ),

    "passive_aggressive": lambda: PassiveAggressiveRegressor(
        max_iter=2000,
        random_state=42,
    ),

    "theil_sen": lambda: TheilSenRegressor(
        random_state=42,
    ),

    # --------------------------------------------------------
    # 2. Polynomial regression
    # --------------------------------------------------------

    "polynomial_regression": lambda: Pipeline(
        steps=[
            (
                "polynomial_features",
                PolynomialFeatures(
                    degree=2,
                    include_bias=False,
                ),
            ),
            (
                "linear_regression",
                LinearRegression(),
            ),
        ]
    ),

    # --------------------------------------------------------
    # 3. Tree-based regression algorithms
    # --------------------------------------------------------

    "decision_tree": lambda: DecisionTreeRegressor(
        random_state=42,
    ),

    "random_forest": lambda: RandomForestRegressor(
        n_estimators=200,
        random_state=42,
        n_jobs=-1,
    ),

    "extra_trees": lambda: ExtraTreesRegressor(
        n_estimators=200,
        random_state=42,
        n_jobs=-1,
    ),

    # --------------------------------------------------------
    # 4. Boosting and ensemble algorithms
    # --------------------------------------------------------

    "gradient_boosting": lambda: GradientBoostingRegressor(
        n_estimators=100,
        random_state=42,
    ),

    "hist_gradient_boosting": lambda: HistGradientBoostingRegressor(
        max_iter=100,
        random_state=42,
    ),

    "adaboost": lambda: AdaBoostRegressor(
        n_estimators=100,
        random_state=42,
    ),

    "bagging": lambda: BaggingRegressor(
        n_estimators=100,
        random_state=42,
        n_jobs=-1,
    ),

    # --------------------------------------------------------
    # 5. Distance-based regression
    # --------------------------------------------------------

    "knn": lambda: KNeighborsRegressor(
        n_neighbors=3,
        weights="distance",
    ),

    # --------------------------------------------------------
    # 6. Support Vector Regression
    # --------------------------------------------------------

    "svr": lambda: SVR(
        kernel="rbf",
    ),

    "linear_svr": lambda: LinearSVR(
        max_iter=5000,
        random_state=42,
    ),

    "nu_svr": lambda: NuSVR(),

    # --------------------------------------------------------
    # 7. Kernel-based regression
    # --------------------------------------------------------

    "kernel_ridge": lambda: KernelRidge(
        alpha=1.0,
        kernel="rbf",
    ),

    # --------------------------------------------------------
    # 8. Neural network regression
    # --------------------------------------------------------

    "mlp": lambda: MLPRegressor(
        hidden_layer_sizes=(100,),
        max_iter=500,
        random_state=42,
    ),

    # --------------------------------------------------------
    # 9. Specialized regression algorithms
    # --------------------------------------------------------

    "quantile": lambda: QuantileRegressor(
        quantile=0.5,
        solver="highs",
    ),

    "poisson": lambda: PoissonRegressor(
        max_iter=1000,
    ),

    "gamma": lambda: GammaRegressor(
        max_iter=1000,
    ),

    "tweedie": lambda: TweedieRegressor(
        power=1.5,
        max_iter=1000,
    ),
}
