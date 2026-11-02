import unittest
import pandas as pd
from ml_service.recommendation.collaborative_filtering import CollaborativeFilter
from ml_service.preprocessing.clean_data import clean_ratings
from ml_service.evaluation.metrics import regression_metrics, precision_recall_at_k

class RecommendationTests(unittest.TestCase):
    def setUp(self):
        self.ratings = pd.DataFrame([
            ('u1', 1, 5, 1), ('u1', 2, 4, 2), ('u1', 3, 4, 3),
            ('u2', 1, 5, 1), ('u2', 2, 4, 2), ('u2', 3, 5, 3), ('u2', 4, 2, 4),
            ('u3', 1, 1, 1), ('u3', 2, 2, 2), ('u3', 4, 5, 3), ('u3', 5, 4, 4),
            ('u4', 1, 1, 1), ('u4', 2, 2, 2), ('u4', 4, 4, 3), ('u4', 5, 5, 4),
        ], columns=['userId', 'movieId', 'rating', 'timestamp'])

    def test_user_and_item_models_return_only_unrated_valid_scores(self):
        for strategy in ('user', 'item'):
            result = CollaborativeFilter(self.ratings, strategy, neighbors=10, min_similarity=0).recommend('u1', 10)
            self.assertTrue(result)
            self.assertTrue(all(row['movieId'] not in {1, 2, 3} for row in result))
            self.assertTrue(all(0.5 <= row['score'] <= 5 for row in result))
            self.assertTrue(all(row['strategy'] == strategy for row in result))

    def test_invalid_ratings_are_removed_and_latest_duplicate_is_kept(self):
        raw = pd.concat([self.ratings, pd.DataFrame([('u1', 1, 3.5, 20), ('u1', 9, 8, 21)], columns=self.ratings.columns)])
        clean = clean_ratings(raw)
        self.assertEqual(clean.loc[(clean.userId == 'u1') & (clean.movieId == 1), 'rating'].iloc[0], 3.5)
        self.assertNotIn(9, clean.movieId.values)

    def test_metrics_use_actual_inputs(self):
        self.assertEqual(regression_metrics([5, 3], [4, 3])['mae'], 0.5)
        metrics = precision_recall_at_k([1, 2, 3], {2, 4}, k=2)
        self.assertEqual(metrics, {'precision_at_k': 0.5, 'recall_at_k': 0.5})

if __name__ == '__main__': unittest.main()
