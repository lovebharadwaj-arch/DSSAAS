"""Classification algorithm factories."""

from sklearn.ensemble import (
    AdaBoostClassifier,
    ExtraTreesClassifier,
    GradientBoostingClassifier,
    RandomForestClassifier,
)
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier

CLASSIFIERS = {
    "logistic_regression": lambda: LogisticRegression(max_iter=1000, class_weight="balanced"),
    "knn": lambda: KNeighborsClassifier(n_neighbors=5),
    "decision_tree": lambda: DecisionTreeClassifier(random_state=42, class_weight="balanced"),
    "random_forest": lambda: RandomForestClassifier(
        n_estimators=200, random_state=42, class_weight="balanced"
    ),
    "svm": lambda: SVC(class_weight="balanced"),
    "naive_bayes": lambda: GaussianNB(),
    "gradient_boosting": lambda: GradientBoostingClassifier(random_state=42),
    "extra_trees": lambda: ExtraTreesClassifier(
        n_estimators=200, random_state=42, class_weight="balanced"
    ),
    "adaboost": lambda: AdaBoostClassifier(random_state=42),
    "mlp": lambda: MLPClassifier(hidden_layer_sizes=(100,), max_iter=500, random_state=42),
}
