
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split


class LinearRegressionModel:

    def __init__(self):
        self.model = LinearRegression()

    def train(
        self,
        X,
        y,
        test_size=0.2,
        random_state=42
    ):
        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=test_size,
            random_state=random_state
        )

        self.model.fit(X_train, y_train)

        predictions = self.model.predict(X_test)

        metrics = {
            "mae": float(mean_absolute_error(y_test, predictions)),
            "mse": float(mean_squared_error(y_test, predictions)),
            "rmse": float(np.sqrt(mean_squared_error(y_test, predictions))),
            "r2_score": float(r2_score(y_test, predictions))
        }

        return {
            "metrics": metrics,
            "predictions": predictions.tolist(),
            "actual": np.asarray(y_test).tolist()
        }

    def predict(self, X):
        return self.model.predict(X).tolist()
