import React from 'react';
import { Typography, Card, CardBody } from "@material-tailwind/react";

function Settings() {
  return (
    <div>
      <Typography variant="h4" color="blue-gray" className="mb-4">
        الإعدادات
      </Typography>

      <Card className="p-4">
        <CardBody>
          <Typography variant="h6" color="blue-gray" className="mb-2">
            إعدادات التطبيق
          </Typography>
          <Typography variant="paragraph" color="blue-gray">
            هنا يمكنك تعديل إعدادات التطبيق المختلفة.
          </Typography>
          {/* Add actual settings components here later */}
        </CardBody>
      </Card>
    </div>
  );
}

export default Settings;